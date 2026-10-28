module.exports = {
  apps: [
    {
      name: 'farmacia-api',
      cwd: '/root/Farmacia/apps/api',
      script: 'dist/main.js',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '600M',
    },
    {
      name: 'farmacia-web',
      cwd: '/root/Farmacia',
      script: 'npm',
      args: '-w apps/web run start -- -p 3000 -H 127.0.0.1',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '800M',
    },
  ],
};
