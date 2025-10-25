module.exports = {
  apps: [
    {
      name: 'agrilink-backend',
      script: 'server.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'agrilink-frontend',
      // Use a stable path into Next's CLI and bind to all interfaces
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 0.0.0.0',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
