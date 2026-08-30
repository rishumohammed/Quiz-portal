module.exports = {
  apps: [
    {
      name: 'kefta-backend',
      script: './backend/src/app.js',
      cwd: '/var/www/ktep/',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5003
      }
    },
    {
      name: 'kefta-frontend',
      script: './frontend/.output/server/index.mjs',
      cwd: '/var/www/ktep/',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
