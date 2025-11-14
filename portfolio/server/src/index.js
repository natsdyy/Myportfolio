const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { ensureTables } = require('./db');
const contactRouter = require('./routes/contact');
const authRouter = require('./routes/auth');

const app = express();

const allowedOrigins = config.allowedOrigins;
const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (!allowedOrigins || allowedOrigins.length === 0) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', contactRouter);
app.use('/api/auth', authRouter);

app.use((err, req, res, next) => {
  console.error('[server] Unexpected error', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  try {
    await ensureTables();
    app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  } catch (error) {
    console.error('[server] Failed to start', error);
    process.exit(1);
  }
}

start();

