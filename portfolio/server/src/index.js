const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const { ensureTables } = require('./db');

let contactRouter, authRouter;
try {
  contactRouter = require('./routes/contact');
  authRouter = require('./routes/auth');
  console.log('[server] Routers loaded successfully:', {
    contactRouter: !!contactRouter,
    authRouter: !!authRouter
  });
} catch (error) {
  console.error('[server] Failed to load routers:', error);
  process.exit(1);
}

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

// Direct route test (not using router) to verify server is working
app.post('/api/contact-test', (req, res) => {
  console.log('[contact-test] Direct route hit!', req.body);
  res.json({ 
    message: 'Direct route is working!', 
    body: req.body,
    timestamp: new Date().toISOString() 
  });
});

// Debug middleware to log all API requests
app.use('/api', (req, res, next) => {
  console.log(`[server] ${req.method} ${req.path} - Body keys:`, Object.keys(req.body || {}));
  next();
});

// Test route to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// List all available routes for debugging
app.get('/api/routes', (req, res) => {
  res.json({
    routes: [
      'GET  /health',
      'GET  /api/test',
      'GET  /api/routes',
      'POST /api/contact',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'POST /api/auth/me'
    ],
    timestamp: new Date().toISOString()
  });
});

// Verify routers before mounting
if (!contactRouter) {
  console.error('[server] ERROR: contactRouter is not defined!');
} else {
  console.log('[server] contactRouter type:', typeof contactRouter);
  console.log('[server] contactRouter has post method:', typeof contactRouter.post === 'function');
}

app.use('/api', contactRouter);
app.use('/api/auth', authRouter);

// Log registered routes
console.log('[server] Routes registered:');
console.log('  GET  /health');
console.log('  GET  /api/test');
console.log('  POST /api/contact-test (direct route)');
console.log('  GET  /api/routes');
console.log('  POST /api/contact (via router)');
console.log('  POST /api/auth/*');

// 404 handler for unmatched routes (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.error(`[server] 404 - Route not found: ${req.method} ${req.path}`);
    return res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  }
  next();
});

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

