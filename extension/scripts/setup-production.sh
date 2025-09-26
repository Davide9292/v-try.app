#!/bin/bash

# V-Try.app Production Setup Script

echo "🚀 V-Try.app Production Setup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo -e "${BLUE}Checking requirements...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is required but not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Requirements check passed${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    
    # Install root dependencies
    npm install
    
    # Install API dependencies
    cd api
    npm install
    cd ..
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Main setup function
main() {
    echo -e "${BLUE}Starting V-Try.app production setup...${NC}"
    
    check_requirements
    install_dependencies
    
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Set up your environment variables"
    echo "2. Deploy to Railway or your preferred platform"
    echo "3. Update extension configuration"
    echo "4. Test the extension"
}

# Run main function
main "$@"
