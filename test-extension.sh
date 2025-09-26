#!/bin/bash

# V-Try.app Extension Testing Script
echo "🚀 V-Try.app Extension Testing"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Checking backend health...${NC}"
HEALTH=$(curl -s https://v-tryapp-production.up.railway.app/health)
if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    echo "   Status: $(echo $HEALTH | grep -o '"status":"[^"]*' | cut -d'"' -f4)"
    echo "   Database: $(echo $HEALTH | grep -o '"database":"[^"]*' | cut -d'"' -f4)"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}2. Extension files check...${NC}"

# Check essential files
FILES=("extension/manifest.json" "extension/popup-minimal.html" "extension/popup-minimal.js" "extension/content-minimal.js")
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
    fi
done

echo ""
echo -e "${BLUE}3. Testing steps:${NC}"
echo "   1. Open Chrome: chrome://extensions/"
echo "   2. Enable Developer mode"
echo "   3. Click 'Load unpacked'"
echo "   4. Select the 'extension/' folder"
echo "   5. Click the V-Try.app extension icon"
echo ""
echo -e "${YELLOW}📖 For detailed testing: see EXTENSION_SIGNIN_TEST.md${NC}"
echo ""
echo -e "${GREEN}🎯 Ready to test! Your extension should work perfectly.${NC}"
