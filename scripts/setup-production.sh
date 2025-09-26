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

# Setup database
setup_database() {
    echo -e "${BLUE}Setting up database...${NC}"
    
    if [ -z "$DATABASE_URL" ]; then
        echo -e "${YELLOW}⚠️  DATABASE_URL not set. Please set it in your environment.${NC}"
        echo "Example: export DATABASE_URL='postgresql://username:password@host:port/database'"
        exit 1
    fi
    
    cd api
    
    echo "Generating Prisma client..."
    npx prisma generate
    
    echo "Running database migrations..."
    npx prisma migrate deploy
    
    echo "Seeding database..."
    npx prisma db seed
    
    cd ..
    
    echo -e "${GREEN}✅ Database setup completed${NC}"
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
    
    # Install website dependencies  
    cd website
    npm install
    cd ..
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Build project
build_project() {
    echo -e "${BLUE}Building project...${NC}"
    
    # Build API
    cd api
    npm run build
    cd ..
    
    # Build website
    cd website
    npm run build
    cd ..
    
    echo -e "${GREEN}✅ Project built successfully${NC}"
}

# Test deployment
test_deployment() {
    echo -e "${BLUE}Testing deployment...${NC}"
    
    if [ -z "$API_URL" ]; then
        echo -e "${YELLOW}⚠️  API_URL not set. Skipping deployment test.${NC}"
        return
    fi
    
    echo "Testing health endpoint..."
    if curl -f "$API_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
    fi
}

# Main setup function
main() {
    echo -e "${BLUE}Starting V-Try.app production setup...${NC}"
    
    check_requirements
    install_dependencies
    
    if [ "$1" = "--with-db" ]; then
        setup_database
    fi
    
    if [ "$1" = "--build" ] || [ "$2" = "--build" ]; then
        build_project
    fi
    
    if [ "$1" = "--test" ] || [ "$2" = "--test" ] || [ "$3" = "--test" ]; then
        test_deployment
    fi
    
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Set up your environment variables"
    echo "2. Deploy to Railway or your preferred platform"
    echo "3. Update extension configuration"
    echo "4. Test the extension"
    echo ""
    echo -e "${BLUE}For detailed instructions, see:${NC} docs/DEPLOYMENT_GUIDE.md"
}

# Handle command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "V-Try.app Production Setup Script"
    echo ""
    echo "Usage: ./setup-production.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --with-db    Setup and migrate database"
    echo "  --build      Build the project"
    echo "  --test       Test the deployment"
    echo "  --help, -h   Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./setup-production.sh --with-db --build"
    echo "  ./setup-production.sh --test"
    exit 0
fi

# Run main function
main "$@"