require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Disable SSL verification in development (corporate network / self-signed cert)
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const { initDatabase } = require('./db/database');
const sessionsRouter = require('./routes/sessions');
const questionsRouter = require('./routes/questions');
const pollsRouter = require('./routes/polls');
const { setupSocketHandlers } = require('./socket/handlers');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

const io = new Server(server, {
  cors: {
    origin: IS_PROD ? false : ['http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: IS_PROD ? false : 'http://localhost:5173',
}));
app.use(express.json());

// Initialize database
initDatabase();

// API routes
app.use('/api/sessions', sessionsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/polls', pollsRouter);

// Serve React build in production
if (IS_PROD) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Socket.io handlers
setupSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${IS_PROD ? 'production' : 'development'}]`);
});
