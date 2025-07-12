
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Route imports
const authRoutes = require('./routes/auth');
const msmeBazaarRoutes = require('./routes/msmeBazaar');
const navarambhRoutes = require('./routes/navarambh');
const agentHubRoutes = require('./routes/agentHub');
const complianceRoutes = require('./routes/compliance');
const loanRoutes = require('./routes/loans');
const procurementRoutes = require('./routes/procurement');
const dashboardRoutes = require('./routes/dashboard');

// Database connection
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');

// Domain middleware
const { domainHandler, wwwRedirect, httpsRedirect } = require('./middleware/domain');

const app = express();
const PORT = process.env.PORT || 5000;

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: [
    'https://vyapaarmitra.in',
    'https://www.vyapaarmitra.in',
    'http://localhost:3000',
    'https://*.replit.dev',
    'https://*.replit.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(limiter);
app.use(httpsRedirect);
app.use(wwwRedirect);
app.use(domainHandler);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'VyapaarMitra API',
    domain: process.env.DOMAIN || 'vyapaarmitra.in',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Domain-specific routes
const domainRoutes = require('./routes/domain');
app.use('/', domainRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/msme-bazaar', msmeBazaarRoutes);
app.use('/api/navarambh', navarambhRoutes);
app.use('/api/agent-hub', agentHubRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database connections and start server
async function startServer() {
  try {
    await connectDB();
    await connectRedis();
    
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`VyapaarMitra server running on port ${PORT}`);
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
