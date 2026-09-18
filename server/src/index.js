const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { config } = require('./config');

let contactRouter, aiRouter;
try {
  contactRouter = require('./routes/contact');
  aiRouter = require('./routes/aiRoutes');
  console.log('[server] Routers loaded successfully:', {
    contactRouter: !!contactRouter,
    aiRouter: !!aiRouter
  });
} catch (error) {
  console.error('[server] Failed to load routers:', error);
  process.exit(1);
}

const app = express();

const allowedOrigins = config.allowedOrigins || [];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`[cors] Blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Serve static files from frontend build (if dist folder exists)
const distPath = path.join(__dirname, '../../dist');
const frontendExists = fs.existsSync(distPath);

if (frontendExists) {
  // Serve static files (CSS, JS, images, etc.)
  app.use(express.static(distPath));
} else {
  // If frontend not built, show API info
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Backend API server is running. Frontend will be served here once built.',
      endpoints: {
        health: '/health',
        api: '/api',
        test: '/api/test',
        routes: '/api/routes',
        contact: '/api/contact'
      },
      timestamp: new Date().toISOString()
    });
  });
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
      'POST /api/ai/chat'
    ],
    timestamp: new Date().toISOString()
  });
});

// Verify routers before mounting
if (!contactRouter) {
  console.error('[server] ERROR: contactRouter is not defined!');
} else {
  console.log('[server] contactRouter type:', typeof contactRouter);
}

app.use('/api', contactRouter);
app.use('/api/ai', aiRouter);

// Log registered routes
console.log('[server] Routes registered:');
console.log('  GET  /health');
console.log('  GET  /api/test');
console.log('  GET  /api/routes');
console.log('  POST /api/contact (via router)');
console.log('  POST /api/ai/chat');

// 404 handler for unmatched API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.error(`[server] 404 - Route not found: ${req.method} ${req.path}`);
    return res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  }
  next();
});

// Catch-all middleware for SPA routing (placed after all routes)
// This serves index.html for any GET request that doesn't match API routes
if (frontendExists) {
  app.use((req, res, next) => {
    // Only handle GET requests that aren't API or health check routes
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
      // Check if the request was already handled (e.g., static file was served)
      if (!res.headersSent) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    } else {
      next();
    }
  });
}

app.use((err, req, res, next) => {
  console.error('[server] Unexpected error', err);
  res.status(500).json({ error: 'Internal server error' });
});

function start() {
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
