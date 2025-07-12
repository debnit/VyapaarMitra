
const express = require('express');
const router = express.Router();

// Domain verification endpoint for SSL certificates
router.get('/.well-known/acme-challenge/:token', (req, res) => {
  const token = req.params.token;
  // This would be used by Let's Encrypt or other SSL providers
  res.type('text/plain');
  res.send(process.env[`ACME_CHALLENGE_${token}`] || 'Challenge not found');
});

// Sitemap for SEO
router.get('/sitemap.xml', (req, res) => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://vyapaarmitra.in/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://vyapaarmitra.in/msme-bazaar</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://vyapaarmitra.in/navarambh</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://vyapaarmitra.in/agent-hub</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
  
  res.type('application/xml');
  res.send(sitemap);
});

// Robots.txt for SEO
router.get('/robots.txt', (req, res) => {
  const robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Sitemap: https://vyapaarmitra.in/sitemap.xml`;
  
  res.type('text/plain');
  res.send(robots);
});

module.exports = router;
