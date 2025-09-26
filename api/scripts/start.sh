#!/bin/sh

echo "🚀 Starting V-Try.app API..."

# Check critical environment variables
echo "📋 Environment Check:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..." # Show first 30 chars only for security
echo "REDIS_URL: ${REDIS_URL:0:30}..."
echo "JWT_SECRET: ${JWT_SECRET:+SET}" # Show SET if exists, empty if not

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set!"
  echo "⚠️  Starting without database - some features will be disabled"
  npm start
  exit $?
fi

# Check if JWT_SECRET is set
if [ -z "$JWT_SECRET" ]; then
  echo "❌ JWT_SECRET is not set!"
  echo "🔑 Generating temporary JWT secret..."
  export JWT_SECRET="temp-jwt-secret-$(date +%s)-$(openssl rand -hex 16 2>/dev/null || echo 'fallback')"
  echo "⚠️  Using temporary JWT secret: ${JWT_SECRET:0:20}..."
fi

echo "🗃️  Setting up database..."

# Try to setup database with multiple fallback strategies
if npx prisma db push --force-reset --skip-generate; then
  echo "✅ Database setup successful with db push"
elif npx prisma migrate deploy; then
  echo "✅ Database setup successful with migrate deploy"
elif npx prisma db push --skip-generate; then
  echo "✅ Database setup successful with db push (no reset)"
else
  echo "⚠️  Database setup failed, but continuing to start server..."
  echo "📝 You may need to manually set up the database"
fi

echo "🚀 Starting application server..."
npm start