-- V-Try.app PostgreSQL Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Create additional databases if needed
-- CREATE DATABASE vtry_app_test;
-- CREATE DATABASE vtry_app_staging;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE vtry_app TO vtry_user;

-- Create indexes for better performance (will be created by Prisma migrations)
-- These are just examples and will be handled by Prisma

-- Set timezone
SET timezone = 'UTC';

-- Configure PostgreSQL settings for better performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries taking more than 1 second

-- Reload configuration
SELECT pg_reload_conf();
