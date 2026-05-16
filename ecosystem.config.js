module.exports = {
    apps: [{
        name: 'delivery-platform',
        script: 'dist/main.js',
        instances: 2, // Number of CPU cores
        exec_mode: 'cluster',
        watch: false,
        env: {
            NODE_ENV: 'development',
        },
        env_production: {
            NODE_ENV: 'production',
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,
        max_memory_restart: '1G',
    }],
};