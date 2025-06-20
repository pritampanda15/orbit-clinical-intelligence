#!/bin/bash

# OR-BIT Clinical Intelligence System - Automated Installation Script
# Usage: ./install.sh [--quick] [--docker] [--production]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="OR-BIT Clinical Intelligence"
REPO_URL="https://github.com/pritampanda15/orbit-clinical-ai.git"
BACKEND_PORT=8000
FRONTEND_PORT=3000
MIN_NODE_VERSION="18.0.0"
MIN_PYTHON_VERSION="3.11.0"

# Parse command line arguments
QUICK_INSTALL=false
DOCKER_INSTALL=false
PRODUCTION_INSTALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --quick)
            QUICK_INSTALL=true
            shift
            ;;
        --docker)
            DOCKER_INSTALL=true
            shift
            ;;
        --production)
            PRODUCTION_INSTALL=true
            shift
            ;;
        -h|--help)
            echo "OR-BIT Installation Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --quick       Quick installation with minimal prompts"
            echo "  --docker      Install using Docker containers"
            echo "  --production  Production deployment setup"
            echo "  -h, --help    Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Utility functions
print_header() {
    echo ""
    echo -e "${PURPLE}=================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}=================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Version comparison function
version_compare() {
    local version1=$1
    local version2=$2
    local operator=$3
    
    # Convert version strings to arrays
    IFS='.' read -ra VER1 <<< "$version1"
    IFS='.' read -ra VER2 <<< "$version2"
    
    # Compare versions
    for i in "${!VER1[@]}"; do
        if [[ ${VER2[i]} -lt ${VER1[i]} ]]; then
            return 1
        elif [[ ${VER2[i]} -gt ${VER1[i]} ]]; then
            return 0
        fi
    done
    return 0
}

# Check system requirements
check_requirements() {
    print_header "Checking System Requirements"
    
    local requirements_met=true
    
    # Check operating system
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_success "Operating System: Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_success "Operating System: macOS"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        print_success "Operating System: Windows (WSL/Cygwin)"
    else
        print_warning "Operating System: $OSTYPE (may not be fully supported)"
    fi
    
    # Check Node.js
    if command_exists node; then
        local node_version=$(node --version | sed 's/v//')
        if version_compare "$MIN_NODE_VERSION" "$node_version" "<="; then
            print_success "Node.js: $node_version (>= $MIN_NODE_VERSION required)"
        else
            print_error "Node.js: $node_version (>= $MIN_NODE_VERSION required)"
            requirements_met=false
        fi
    else
        print_error "Node.js: Not installed (>= $MIN_NODE_VERSION required)"
        requirements_met=false
    fi
    
    # Check npm
    if command_exists npm; then
        local npm_version=$(npm --version)
        print_success "npm: $npm_version"
    else
        print_error "npm: Not installed"
        requirements_met=false
    fi
    
    # Check Python
    if command_exists python3; then
        local python_version=$(python3 --version | awk '{print $2}')
        if version_compare "$MIN_PYTHON_VERSION" "$python_version" "<="; then
            print_success "Python: $python_version (>= $MIN_PYTHON_VERSION required)"
        else
            print_error "Python: $python_version (>= $MIN_PYTHON_VERSION required)"
            requirements_met=false
        fi
    else
        print_error "Python: Not installed (>= $MIN_PYTHON_VERSION required)"
        requirements_met=false
    fi
    
    # Check pip
    if command_exists pip3; then
        local pip_version=$(pip3 --version | awk '{print $2}')
        print_success "pip: $pip_version"
    else
        print_error "pip: Not installed"
        requirements_met=false
    fi
    
    # Check Git
    if command_exists git; then
        local git_version=$(git --version | awk '{print $3}')
        print_success "Git: $git_version"
    else
        print_error "Git: Not installed"
        requirements_met=false
    fi
    
    # Check Docker (if docker install requested)
    if [[ "$DOCKER_INSTALL" == true ]]; then
        if command_exists docker; then
            local docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
            print_success "Docker: $docker_version"
        else
            print_error "Docker: Not installed (required for Docker installation)"
            requirements_met=false
        fi
        
        if command_exists docker-compose; then
            local compose_version=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
            print_success "Docker Compose: $compose_version"
        else
            print_error "Docker Compose: Not installed"
            requirements_met=false
        fi
    fi
    
    if [[ "$requirements_met" == false ]]; then
        print_error "System requirements not met. Please install missing dependencies."
        echo ""
        echo "Installation guides:"
        echo "• Node.js: https://nodejs.org/"
        echo "• Python: https://python.org/"
        echo "• Git: https://git-scm.com/"
        if [[ "$DOCKER_INSTALL" == true ]]; then
            echo "• Docker: https://docker.com/"
        fi
        exit 1
    fi
    
    print_success "All system requirements met!"
}

# Clone or update repository
setup_repository() {
    print_header "Setting Up Repository"
    
    if [[ -d "orbit-clinical-ai" ]]; then
        print_info "Repository already exists. Updating..."
        cd orbit-clinical-ai
        git pull origin main
    else
        print_info "Cloning repository..."
        git clone "$REPO_URL"
        cd orbit-clinical-ai
    fi
    
    print_success "Repository ready"
}

# Setup backend
setup_backend() {
    print_header "Setting Up Backend"
    
    cd backend
    
    # Create virtual environment
    if [[ ! -d "venv" ]]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_info "Activating virtual environment..."
    source venv/bin/activate
    
    # Upgrade pip
    print_info "Upgrading pip..."
    pip install --upgrade pip
    
    # Install dependencies
    print_info "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Create environment file
    if [[ ! -f ".env" ]]; then
        print_info "Creating environment file..."
        cp .env.example .env
        
        if [[ "$QUICK_INSTALL" == false ]]; then
            echo ""
            print_warning "Please edit backend/.env with your OpenAI API key:"
            echo "OPENAI_API_KEY=sk-your-key-here"
            echo ""
            read -p "Press Enter to continue after editing .env file..."
        fi
    fi
    
    cd ..
    print_success "Backend setup complete"
}

# Setup frontend
setup_frontend() {
    print_header "Setting Up Frontend"
    
    cd frontend
    
    # Install dependencies
    print_info "Installing Node.js dependencies..."
    npm install
    
    # Create environment file
    if [[ ! -f ".env.local" ]]; then
        print_info "Creating frontend environment file..."
        cp .env.local.example .env.local 2>/dev/null || echo "NEXT_PUBLIC_API_BASE=http://localhost:$BACKEND_PORT" > .env.local
    fi
    
    cd ..
    print_success "Frontend setup complete"
}

# Docker setup
setup_docker() {
    print_header "Setting Up Docker Environment"
    
    # Create environment file for Docker
    if [[ ! -f ".env" ]]; then
        print_info "Creating Docker environment file..."
        cat > .env << EOF
OPENAI_API_KEY=sk-your-key-here
POSTGRES_DB=orbit_db
POSTGRES_USER=orbit_user
POSTGRES_PASSWORD=orbit_pass
EOF
        
        if [[ "$QUICK_INSTALL" == false ]]; then
            print_warning "Please edit .env with your OpenAI API key"
            read -p "Press Enter to continue after editing .env file..."
        fi
    fi
    
    # Build and start containers
    print_info "Building Docker containers..."
    docker-compose build
    
    print_success "Docker setup complete"
}

# Create startup scripts
create_scripts() {
    print_header "Creating Startup Scripts"
    
    # Development startup script
    cat > start-dev.sh << 'EOF'
#!/bin/bash

# OR-BIT Development Startup Script

echo "🚀 Starting OR-BIT Development Environment..."

# Start backend
echo "📡 Starting backend server..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend
echo "🌐 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ OR-BIT is starting up!"
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

    # Production startup script
    cat > start-prod.sh << 'EOF'
#!/bin/bash

# OR-BIT Production Startup Script

echo "🚀 Starting OR-BIT Production Environment..."

if command -v docker-compose >/dev/null 2>&1; then
    echo "🐳 Using Docker Compose..."
    docker-compose -f docker-compose.prod.yml up -d
    echo "✅ OR-BIT started in production mode"
    echo "🌐 Access: http://localhost"
else
    echo "📦 Manual production start..."
    
    # Start backend
    cd backend
    source venv/bin/activate
    gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --daemon
    cd ..
    
    # Build and start frontend
    cd frontend
    npm run build
    npm start &
    cd ..
    
    echo "✅ OR-BIT started in production mode"
    echo "🌐 Frontend: http://localhost:3000"
    echo "📡 Backend: http://localhost:8000"
fi
EOF

    chmod +x start-dev.sh start-prod.sh
    print_success "Startup scripts created"
}

# Test installation
test_installation() {
    print_header "Testing Installation"
    
    if [[ "$DOCKER_INSTALL" == true ]]; then
        print_info "Testing Docker installation..."
        docker-compose up -d
        sleep 10
        
        # Test backend
        if curl -s http://localhost:$BACKEND_PORT/health > /dev/null; then
            print_success "Backend health check passed"
        else
            print_error "Backend health check failed"
        fi
        
        docker-compose down
    else
        print_info "Testing backend..."
        cd backend
        source venv/bin/activate
        python -c "import main; print('Backend imports successful')"
        cd ..
        
        print_info "Testing frontend..."
        cd frontend
        npm run build > /dev/null 2>&1
        print_success "Frontend build successful"
        cd ..
    fi
    
    print_success "Installation test passed"
}

# Main installation flow
main() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
   ____  _____       ____  _____ _______ 
  / __ \|  __ \     |  _ \|_   _|__   __|
 | |  | | |__) |____| |_) | | |    | |   
 | |  | |  _  /_____|  _ <  | |    | |   
 | |__| | | \ \     | |_) |_| |_   | |   
  \____/|_|  \_\    |____/|_____|  |_|   
                                         
   Clinical Intelligence System
EOF
    echo -e "${NC}"
    
    echo -e "${BLUE}$PROJECT_NAME Installation${NC}"
    echo ""
    
    if [[ "$QUICK_INSTALL" == false ]]; then
        echo "This script will install OR-BIT with the following components:"
        echo "• FastAPI backend with GPT-4-turbo integration"
        echo "• Next.js frontend with real-time dashboard"
        echo "• Clinical AI chat and risk forecasting"
        echo "• Real-time vitals monitoring"
        echo ""
        
        read -p "Continue with installation? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Installation cancelled."
            exit 0
        fi
    fi
    
    # Check requirements
    check_requirements
    
    # Setup repository
    setup_repository
    
    if [[ "$DOCKER_INSTALL" == true ]]; then
        setup_docker
    else
        setup_backend
        setup_frontend
    fi
    
    # Create startup scripts
    create_scripts
    
    # Test installation
    if [[ "$QUICK_INSTALL" == false ]]; then
        test_installation
    fi
    
    # Final instructions
    print_header "Installation Complete!"
    
    echo -e "${GREEN}🎉 OR-BIT has been successfully installed!${NC}"
    echo ""
    
    if [[ "$DOCKER_INSTALL" == true ]]; then
        echo "To start OR-BIT with Docker:"
        echo -e "${CYAN}  docker-compose up${NC}"
        echo ""
        echo "To start in production mode:"
        echo -e "${CYAN}  ./start-prod.sh${NC}"
    else
        echo "To start OR-BIT in development mode:"
        echo -e "${CYAN}  ./start-dev.sh${NC}"
        echo ""
        echo "Or manually:"
        echo -e "${CYAN}  # Terminal 1 - Backend${NC}"
        echo -e "${CYAN}  cd backend && source venv/bin/activate && uvicorn main:app --reload${NC}"
        echo ""
        echo -e "${CYAN}  # Terminal 2 - Frontend${NC}"
        echo -e "${CYAN}  cd frontend && npm run dev${NC}"
    fi
    
    echo ""
    echo "Access points:"
    echo -e "${BLUE}  🌐 Dashboard: http://localhost:$FRONTEND_PORT${NC}"
    echo -e "${BLUE}  📡 API: http://localhost:$BACKEND_PORT${NC}"
    echo -e "${BLUE}  📚 API Docs: http://localhost:$BACKEND_PORT/docs${NC}"
    echo ""
    
    if [[ "$QUICK_INSTALL" == false && "$DOCKER_INSTALL" == false ]]; then
        print_warning "Don't forget to:"
        echo "  1. Add your OpenAI API key to backend/.env"
        echo "  2. Review configuration files"
        echo "  3. Check firewall settings if needed"
        echo ""
    fi
    
    echo -e "${PURPLE}Happy clinical AI development! 🩺🤖${NC}"
}

# Run main installation
main "$@"
