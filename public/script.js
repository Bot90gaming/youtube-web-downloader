window.addEventListener('load', () => {
    const urlInput = document.getElementById('url-input');
    const fetchBtn = document.getElementById('fetch-info-btn');
    const formatSelect = document.getElementById('format-select');
    const resolutionSelect = document.getElementById('resolution-select');
    const downloadBtn = document.getElementById('download-btn');
    const errorMsg = document.getElementById('error-message');
    const successMsg = document.getElementById('success-message');
    const preview = document.getElementById('preview-panel');
    const loading = document.getElementById('loading-indicator');
    const themeToggle = document.getElementById('theme-toggle');
    const advanced = document.getElementById('advanced-options');

    // Dark Mode Persistence
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.body.classList.add('dark');
    themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    themeToggle.addEventListener('click', () => {
        const dark = document.body.classList.toggle('dark');
        localStorage.setItem('darkMode', dark);
        themeToggle.textContent = dark ? '☀️ Light Mode' : '🌙 Dark Mode';
        gsap.to('body', { backgroundColor: dark ? '#121212' : '#f9f9f9', duration: 0.5 });
    });

    // Run Animations on Load/Reload
    gsap.from('header', { opacity: 0, y: -50, duration: 1, ease: 'power2.out' });
    gsap.from('.input-section > *', { opacity: 0, y: 20, stagger: 0.1, duration: 0.8, ease: 'power2.out' });
    gsap.from('footer', { opacity: 0, y: 50, duration: 1, ease: 'power2.out' });

    urlInput.addEventListener('focus', () => gsap.to(urlInput, { scale: 1.02, boxShadow: '0 0 10px var(--primary)', duration: 0.3 }));
    urlInput.addEventListener('blur', () => gsap.to(urlInput, { scale: 1, boxShadow: 'none', duration: 0.3 }));

    fetchBtn.addEventListener('mouseover', () => gsap.to(fetchBtn, { scale: 1.05, duration: 0.2 }));
    fetchBtn.addEventListener('mouseout', () => gsap.to(fetchBtn, { scale: 1, duration: 0.2 }));
    downloadBtn.addEventListener('mouseover', () => gsap.to(downloadBtn, { scale: 1.05, duration: 0.2 }));
    downloadBtn.addEventListener('mouseout', () => gsap.to(downloadBtn, { scale: 1, duration: 0.2 }));

    // Fetch Metadata
    fetchBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            errorMsg.textContent = 'Enter a valid URL';
            gsap.to(urlInput, { x: -5, duration: 0.1, repeat: 3, yoyo: true });
            return;
        }
        errorMsg.textContent = '';
        loading.classList.remove('hidden');
        gsap.to(loading, { width: '100%', duration: 1, repeat: -1, yoyo: true });

        try {
            const res = await fetch('/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            if (!res.ok) throw new Error('Failed to fetch info');
            const info = await res.json();

            // Preview
            preview.innerHTML = `<img src="${info.thumbnail}" alt="${info.title}"><p>${info.title}</p>`;
            gsap.from(preview, { opacity: 0, y: 20, duration: 0.5 });

            // Populate Formats & Resolutions
            formatSelect.innerHTML = '<option value="">Select Format</option>';
            resolutionSelect.innerHTML = '<option value="">Select Resolution</option>';
            const formats = [...new Set(info.formats.map(f => f.ext))]; // Unique formats
            formats.forEach(fmt => {
                const opt = document.createElement('option');
                opt.value = fmt;
                opt.textContent = fmt.toUpperCase();
                formatSelect.appendChild(opt);
            });

            const resolutions = [...new Set(info.formats.map(f => f.height).filter(h => h).sort((a,b) => b-a))];
            resolutions.forEach(res => {
                const opt = document.createElement('option');
                opt.value = res;
                opt.textContent = `${res}p`;
                resolutionSelect.appendChild(opt);
            });

            formatSelect.disabled = false;
            resolutionSelect.disabled = false;
            downloadBtn.disabled = false;
            advanced.classList.remove('hidden');
            gsap.from([formatSelect, resolutionSelect, downloadBtn], { opacity: 0, stagger: 0.1, duration: 0.5 });

            successMsg.textContent = 'Options loaded! Choose and download.';
        } catch (err) {
            errorMsg.textContent = err.message;
        } finally {
            loading.classList.add('hidden');
        }
    });

    // Download
    downloadBtn.addEventListener('click', () => {
        const url = urlInput.value;
        const format = formatSelect.value;
        const resolution = resolutionSelect.value;
        if (!format || !resolution) return alert('Select format and resolution');

        window.location.href = `/download?url=${encodeURIComponent(url)}&format=${format}&resolution=${resolution}`;
        gsap.to(downloadBtn, { rotation: 360, duration: 1 });
    });
});