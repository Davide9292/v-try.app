# Database Setup Guide

Since Docker is not available in this environment, we'll use cloud-hosted database services for development and production.

## 🗄️ PostgreSQL Database Options

### Option 1: Supabase (Recommended for Development)

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string (URI format)
5. Update your `api/.env` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### Option 2: Neon (Great for Production)

1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. Update your `api/.env` file:

```env
DATABASE_URL="postgresql://[user]:[password]@[hostname]/[dbname]"
```

### Option 3: Railway PostgreSQL

1. Go to [Railway](https://railway.app) and create an account
2. Create a new project
3. Add PostgreSQL service
4. Copy the connection string from the Connect tab

## 🔴 Redis Options

### Option 1: Upstash Redis (Recommended)

1. Go to [Upstash](https://upstash.com) and create a free account
2. Create a new Redis database
3. Copy the connection URL
4. Update your `api/.env` file:

```env
REDIS_URL="redis://default:[password]@[host]:[port]"
```

### Option 2: Railway Redis

1. In your Railway project, add Redis service
2. Copy the connection URL from the Connect tab

## 🔧 Environment Configuration

After setting up your database and Redis, update your `api/.env` file:

```env
# Database (use one of the options above)
DATABASE_URL="your-database-connection-string"

# Redis (use one of the options above)  
REDIS_URL="your-redis-connection-string"

# Other required settings
JWT_SECRET="your-super-secure-jwt-secret-change-this"
KIE_AI_API_KEY="your-kie-ai-api-key"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_S3_BUCKET="your-s3-bucket-name"
```

## 🚀 Initialize Database

Once your database is configured:

1. Run database migrations:
```bash
cd api && npx prisma migrate dev --name init
```

2. (Optional) Seed the database:
```bash
cd api && npx prisma db seed
```

3. Open Prisma Studio to view your data:
```bash
cd api && npx prisma studio
```

## 🧪 Test Database Connection

Test your database connection:

```bash
cd api && npx prisma db pull
```

If successful, you should see "Introspecting based on your Prisma schema..."

## 🔗 Useful Commands

- **View database schema**: `cd api && npx prisma studio`
- **Reset database**: `cd api && npx prisma migrate reset`
- **Deploy migrations**: `cd api && npx prisma migrate deploy`
- **Generate client**: `cd api && npx prisma generate`

## 🚨 Security Notes

- Never commit your `.env` file to version control
- Use strong passwords for production databases
- Enable SSL/TLS for production connections
- Regularly backup your production data
- Use read replicas for high-traffic applications
