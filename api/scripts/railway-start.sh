#!/bin/sh

echo "🚀 Railway startup script starting..."

# Setup database
echo "🗃️ Setting up database..."
npx prisma db push --accept-data-loss --skip-generate
if [ $? -eq 0 ]; then
    echo "✅ Database setup completed"
else
    echo "❌ Database setup failed"
    exit 1
fi

# Test basic functionality
echo "🔍 Testing basic functionality..."
npm run debug
if [ $? -eq 0 ]; then
    echo "✅ Debug test passed"
else
    echo "❌ Debug test failed"
    exit 1
fi

# Start the application
echo "🚀 Starting main application..."
npm start