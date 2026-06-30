module.exports = {
  apps: [
    {
      name: 'kefta-backend',
      script: './backend/src/app.js',
      cwd: '/var/www/ktep/',
      env: {
        NODE_ENV: 'production',
        PORT: 5003
      }
    },
    {
      name: 'kefta-frontend',
      script: './frontend/.output/server/index.mjs',
      cwd: '/var/www/ktep/',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
