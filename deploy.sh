#!/bin/bash

echo "🚀 Starting Kefta Talent Hunt Deployment on Ubuntu..."

# The server already has Node.js, PM2, Nginx, and MySQL installed.
echo "⚠️ Assuming Redis is either installed or running on your system for OTP caching."

# Ensure directory exists and clone repo
echo "📁 Setting up project directory at /var/www/ktep/..."
sudo mkdir -p /var/www/ktep
sudo chown -R $USER:$USER /var/www/ktep
cd /var/www/ktep/ || exit

if [ ! -d ".git" ]; then
  echo "📥 Cloning repository..."
  git clone https://github.com/rishumohammed/Quiz-portal.git .
else
  echo "📥 Pulling latest changes..."
  git pull origin main
fi

# 6. Setup Application Dependencies
echo "📂 Installing Backend Dependencies..."
cd backend || exit
npm install

echo "📂 Installing Frontend Dependencies..."
cd ../frontend || exit
npm install --legacy-peer-deps

# 7. Build Frontend (Nuxt 3)
echo "🏗️ Building Frontend..."
npm run build

cd ..

# Generate PM2 Config
echo "📝 Generating ecosystem.config.cjs..."
cat << 'EOF' > /var/www/ktep/ecosystem.config.cjs
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
EOF

# Generate Nginx Config
echo "📝 Generating nginx.conf..."
cat << 'EOF' > /var/www/ktep/nginx.conf
server {
    listen 80;
    server_name talent.kefta.in www.talent.kefta.in;

    location /api/ {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 8. Configure Nginx
echo "🛠️ Configuring Nginx..."
sudo cp /var/www/ktep/nginx.conf /etc/nginx/sites-available/kefta-talent-hunt
sudo ln -sf /etc/nginx/sites-available/kefta-talent-hunt /etc/nginx/sites-enabled/
# sudo rm -f /etc/nginx/sites-enabled/default # Uncomment if you want to disable the default site
sudo nginx -t
sudo systemctl restart nginx

# 9. Start Application with PM2
echo "🚀 Starting PM2 processes..."
pm2 start /var/www/ktep/ecosystem.config.cjs
pm2 save
pm2 startup | tail -n 1 | bash

echo "✅ Deployment Complete! Your application should now be live."
echo "⚠️ Don't forget to configure your MySQL databases and .env files!"
