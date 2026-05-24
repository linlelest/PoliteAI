module.exports = {
  apps: [{
    name: 'politeai',
    script: 'node_modules/.bin/next',
    args: 'start -p 3000',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    // Point to the correct next binary path
    interpreter: 'node',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};