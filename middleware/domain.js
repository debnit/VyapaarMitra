
const express = require('express');

// Middleware to handle domain-specific configurations
const domainHandler = (req, res, next) => {
  const allowedDomains = [
    'vyapaarmitra.in',
    'www.vyapaarmitra.in',
    'localhost',
    '127.0.0.1'
  ];

  const host = req.get('host');
  const origin = req.get('origin');

  // Log request for debugging
  console.log(`Request from host: ${host}, origin: ${origin}`);

  // Set domain-specific headers
  res.setHeader('X-Powered-By', 'VyapaarMitra Platform');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Handle CORS for specific endpoints
  if (req.path.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Origin', origin || `https://${process.env.DOMAIN || 'vyapaarmitra.in'}`);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  next();
};

// Redirect www to non-www
const wwwRedirect = (req, res, next) => {
  if (req.get('host') === 'www.vyapaarmitra.in') {
    return res.redirect(301, `https://vyapaarmitra.in${req.url}`);
  }
  next();
};

// Force HTTPS in production
const httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

module.exports = {
  domainHandler,
  wwwRedirect,
  httpsRedirect
};
