
#!/bin/bash

echo "Preparing VyapaarMitra for production deployment..."

# Create production directories
mkdir -p logs uploads temp

# Set environment to production
export NODE_ENV=production

# Install production dependencies only
npm ci --only=production

# Create optimized configuration
echo "Production deployment ready!"
echo "Remember to set all environment variables in Replit Secrets"
