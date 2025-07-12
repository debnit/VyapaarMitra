
#!/bin/bash

# Create necessary directories
mkdir -p logs
mkdir -p uploads
mkdir -p temp

# Set proper permissions
chmod 755 logs uploads temp

# Create log files
touch logs/error.log
touch logs/combined.log
touch logs/access.log

echo "VyapaarMitra setup completed successfully!"
echo "Remember to:"
echo "1. Copy .env.example to .env and update with your credentials"
echo "2. Run 'npm install' to install dependencies"
echo "3. Set up PostgreSQL and Redis"
echo "4. Run database initialization script"
echo "5. Start the server with 'npm start'"
