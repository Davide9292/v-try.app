#!/bin/bash

# V-Try.app Extension Configuration Update Script
echo "🔧 Updating V-Try.app Extension Configuration"
echo "============================================="

# Prompt for Railway URL
echo "📍 Please enter your Railway deployment URL:"
echo "   (Example: https://vtry-api-production-abcd1234.up.railway.app)"
read -p "Railway URL: " RAILWAY_URL

# Validate URL format
if [[ ! $RAILWAY_URL =~ ^https://.*\.up\.railway\.app$ ]]; then
    echo "⚠️  Warning: URL doesn't look like a Railway URL"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [[ $CONTINUE != "y" ]]; then
        echo "❌ Cancelled"
        exit 1
    fi
fi

echo ""
echo "🔄 Updating extension configuration..."

# Update constants.js
echo "1. Updating API_BASE_URL in extension/shared/constants.js..."
sed -i.bak "s|API_BASE_URL: '.*'|API_BASE_URL: '$RAILWAY_URL'|" extension/shared/constants.js

# Set production mode
echo "2. Setting production mode..."
sed -i.bak "s|IS_DEVELOPMENT: true|IS_DEVELOPMENT: false|" extension/shared/constants.js

# Update manifest.json permissions
echo "3. Updating host_permissions in extension/manifest.json..."
# Create a temporary file with the new permission
TEMP_PERMISSION="    \"$RAILWAY_URL/*\","

# Check if the Railway URL is already in the manifest
if grep -q "$RAILWAY_URL" extension/manifest.json; then
    echo "   Railway URL already in manifest.json"
else
    # Add the new permission after the existing Railway permission line
    sed -i.bak "/vtry-app-backend-production.up.railway.app/a\\
$TEMP_PERMISSION" extension/manifest.json
fi

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "📋 Changes made:"
echo "   - API_BASE_URL: $RAILWAY_URL"
echo "   - IS_DEVELOPMENT: false"
echo "   - Added host permission for your Railway URL"
echo ""
echo "🎯 Next steps:"
echo "   1. Test API connection: ./test-api.sh"
echo "   2. Load extension in Chrome: chrome://extensions/"
echo "   3. Follow EXTENSION_TESTING_GUIDE.md for complete testing"
echo ""
echo "🔄 Backup files created (.bak) in case you need to revert"
