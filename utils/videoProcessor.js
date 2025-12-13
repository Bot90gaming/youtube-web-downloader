const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');

module.exports = async function processVideo(inputFile, format) {
    const outputFile = path.join(os.tmpdir(), `${Date.now()}.${format}`);
    
    return new Promise((resolve, reject) => {
        let command = ffmpeg(inputFile)
            .on('error', (err) => reject(err))
            .on('end', () => resolve(outputFile));

        if (format === 'mp4') {
            command.videoCodec('libx264').format('mp4');
        } else if (format === 'mp3') {
            command.noVideo().audioCodec('libmp3lame').format('mp3');
        } else if (format === 'webm') {
            // Already webm, no-op
            return resolve(inputFile);
        }

        // Optional: Lower bitrate, GPU (if ffmpeg supports)
        // command.videoBitrate('1000k').withVideoCodec('h264_nvenc'); // NVIDIA GPU example

        command.save(outputFile);
    });
};