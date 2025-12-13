module.exports = {
    apps: [{
        name: 'video-downloader',
        script: './server.js',
        instances: 'max', // Cluster mode, max CPUs
        exec_mode: 'cluster',
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        merge_logs: true,
        env: {
            NODE_ENV: 'production'
        }
    }]
};