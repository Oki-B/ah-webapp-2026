require('dotenv').config(); // Load .env dulu
const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
const normalizePort = require('./utils/normalize-port.helper');
const { onServerError } = require('./utils/server-handlers.helper');

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected.');

    server.listen(port);
  } catch (err) {
    console.error('❌ DB Error:', err);
    process.exit(1);
  }
};

server.on('error', (err) => onServerError(err, port));
server.on('listening', () => console.log(`🚀 Server on port ${port}`));

startServer();