import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { YtDlp } from 'ytdlp-nodejs';
import dotenv from 'dotenv';

dotenv.config();

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const TEMP_DIR = process.env.TEMP_DIR || './temp';

// Create temp folder if not exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

// yt-dlp instance
const ytdlp = new YtDlp();

// Auto-download ffmpeg the first time (only once)
try {
  await ytdlp.downloadFFmpeg();
} catch (e) {
  console.log('FFmpeg already available or download skipped');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: Number(process.env.RATE_LIMIT_MAX) || 50,
  message: 'Too many requests – try again later',
});
app.use('/download', limiter);
app.use('/info', limiter);

// Simple URL validation
function isValidUrl(url) {
  // Supports ALL TikTok domains + YouTube, Instagram, etc.
  const allowed = [
    'youtube.com',
    'youtu.be',
    'tiktok.com',
    'vm.tiktok.com',
    'vt.tiktok.com',
    'm.tiktok.com',
    'instagram.com',
    'vimeo.com'
  ];

  try {
    const { hostname } = new URL(url);
    return allowed.some(domain => hostname.endsWith(domain));
  } catch {
    return false;
  }
}
// GET home
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// POST /info – get video metadata
app.post('/info', async (req, res) => {
  const { url } = req.body;
  if (!url || !isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL' });

  try {
    const info = await ytdlp.getInfoAsync(url);
    res.json(info);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

// GET /download – main download with streaming & range support
app.get('/download', async (req, res) => {
  const { url, format = 'mp4', resolution = '720' } = req.query;
  if (!url || !isValidUrl(url)) return res.status(400).send('Bad URL');

  try {
    const tempInput = path.join(TEMP_DIR, `input_${Date.now()}`);
    const tempOutput = path.join(TEMP_DIR, `output_${Date.now()}.${format === 'mp3' ? 'mp3' : format}`);

    // Download best quality ≤ requested resolution
    await ytdlp.downloadAsync(url, {
      format: `best[height<=${resolution}]/best`,
      noPlaylist: true,
      output: tempInput,
    });

    // Convert if needed (mp3 or specific format)
    if (format === 'mp3') {
      await new Promise((resolve, reject) => {
        import('fluent-ffmpeg').then(ffmpeg => {
          ffmpeg.default(tempInput)
            .noVideo()
            .audioCodec('libmp3lame')
            .output(tempOutput)
            .on('end', resolve)
            .on('error', reject)
            .run();
        });
      });
    } else if (format === 'webm') {
      fs.renameSync(tempInput, tempOutput);
    } else {
      // Default to mp4 conversion
      await new Promise((resolve, reject) => {
        import('fluent-ffmpeg').then(ffmpeg => {
          ffmpeg.default(tempInput)
            .videoCodec('libx264')
            .audioCodec('aac')
            .output(tempOutput)
            .on('end', resolve)
            .on('error', reject)
            .run();
        });
      });
    }

    // Stream file with range support
    const stat = fs.statSync(tempOutput);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': format === 'mp3' ? 'audio/mpeg' : `video/${format}`,
      });

      const stream = fs.createReadStream(tempOutput, { start, end });
      stream.pipe(res);
      stream.on('close', () => fs.unlink(tempOutput, () => {}));
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': format === 'mp3' ? 'audio/mpeg' : `video/${format}`,
        'Content-Disposition': `attachment; filename="video.${format}"`,
      });
      fs.createReadStream(tempOutput).pipe(res)
        .on('finish', () => fs.unlink(tempOutput, () => {}));
    }

    // Clean input file
    fs.unlink(tempInput, () => {});
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Download failed');
  }
});

app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
  console.log(`Open the link above in your browser`);
});