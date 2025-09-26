#!/bin/bash

# V-Try.app API Testing Script
echo "🚀 Testing V-Try.app API Deployment"
echo "=================================="

# Replace this with your actual Railway URL
RAILWAY_URL="https://v-tryapp-production.up.railway.app"

echo "📍 Testing API URL: $RAILWAY_URL"
echo ""

echo "1. 🏥 Testing Health Check..."
curl -s "$RAILWAY_URL/health" | jq '.' || echo "Health check failed"
echo ""

echo "2. 🔐 Testing Auth Endpoints..."
echo "Testing signup endpoint structure..."
curl -s -X POST "$RAILWAY_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.' || echo "Signup endpoint not responding"
echo ""

echo "3. 📊 Testing API Routes..."
echo "Testing login endpoint structure..."
curl -s -X POST "$RAILWAY_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.' || echo "Login endpoint not responding"
echo ""

echo "✅ API Testing Complete!"
echo "Replace RAILWAY_URL with your actual Railway domain above"
