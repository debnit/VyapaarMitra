
#!/bin/bash

# Clean deployment script for VyapaarMitra
echo "🧹 Cleaning deployment environment..."

# Remove all lock files and node_modules
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json

# Clear npm cache
npm cache clean --force

# Install dependencies with exact versions
echo "📦 Installing backend dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd frontend && npm install

echo "🏗️ Building frontend..."
npm run build

echo "✅ Clean deployment preparation complete!"
