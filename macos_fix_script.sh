#!/bin/bash

# OR-BIT macOS Installation Fix Script
# Fixes scikit-learn compilation issues on macOS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}🔧 OR-BIT macOS Installation Fix${NC}"
echo "This script will fix scikit-learn compilation issues on macOS"
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is for macOS only"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Solution 1: Install with Homebrew and conda
install_with_conda() {
    print_info "Solution 1: Installing with conda (recommended)"
    
    if ! command_exists conda; then
        print_info "Installing Miniconda..."
        # Download and install Miniconda
        if [[ $(uname -m) == "arm64" ]]; then
            curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-arm64.sh
            bash Miniconda3-latest-MacOSX-arm64.sh -b
            rm Miniconda3-latest-MacOSX-arm64.sh
        else
            curl -O https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh
            bash Miniconda3-latest-MacOSX-x86_64.sh -b
            rm Miniconda3-latest-MacOSX-x86_64.sh
        fi
        
        # Initialize conda
        ~/miniconda3/bin/conda init bash
        source ~/.bash_profile 2>/dev/null || source ~/.bashrc 2>/dev/null || true
    fi
    
    # Create conda environment
    print_info "Creating conda environment..."
    conda create -n orbit python=3.11 -y
    conda activate orbit
    
    # Install dependencies with conda
    print_info "Installing packages with conda..."
    conda install -c conda-forge scikit-learn pandas numpy -y
    conda install -c conda-forge fastapi uvicorn -y
    
    # Install remaining packages with pip
    pip install openai==1.3.0 python-dotenv pydantic shap
    pip install python-socketio websockets httpx aiofiles
    pip install structlog rich pytest pytest-asyncio
    
    print_success "Conda installation complete!"
    echo "To activate: conda activate orbit"
    return 0
}

# Solution 2: Install OpenMP support
install_with_openmp() {
    print_info "Solution 2: Installing OpenMP support"
    
    if ! command_exists brew; then
        print_info "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    
    print_info "Installing OpenMP via Homebrew..."
    brew install libomp
    
    # Set environment variables
    export CC=/usr/bin/clang
    export CXX=/usr/bin/clang++
    export CPPFLAGS=-I/opt/homebrew/include
    export LDFLAGS=-L/opt/homebrew/lib
    
    # For Intel Macs
    if [[ $(uname -m) == "x86_64" ]]; then
        export CPPFLAGS=-I/usr/local/include
        export LDFLAGS=-L/usr/local/lib
    fi
    
    print_info "Installing Python packages..."
    pip install --no-cache-dir scikit-learn
    pip install -r requirements.txt
    
    print_success "OpenMP installation complete!"
}

# Solution 3: Use pre-compiled wheels
install_with_precompiled() {
    print_info "Solution 3: Using pre-compiled wheels"
    
    # Update pip, setuptools, and wheel
    pip install --upgrade pip setuptools wheel
    
    # Install packages one by one with pre-compiled wheels
    print_info "Installing core packages..."
    pip install --only-binary=all numpy pandas scikit-learn
    
    print_info "Installing remaining packages..."
    pip install fastapi==0.104.1
    pip install uvicorn[standard]==0.24.0
    pip install openai==1.3.0
    pip install python-dotenv==1.0.0
    pip install pydantic==2.5.0
    pip install shap==0.43.0
    pip install python-socketio==5.10.0
    pip install websockets==12.0
    pip install httpx==0.25.2
    pip install aiofiles==23.2.1
    pip install structlog==23.2.0
    pip install rich==13.7.0
    
    print_success "Pre-compiled installation complete!"
}

# Solution 4: Create a fixed requirements.txt
create_fixed_requirements() {
    print_info "Solution 4: Creating macOS-compatible requirements.txt"
    
    cat > requirements-macos.txt << 'EOF'
# macOS-compatible requirements for OR-BIT

# Core FastAPI and web framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-dotenv==1.0.0

# CORS and WebSocket support
python-socketio==5.10.0
websockets==12.0

# AI and Machine Learning (pre-compiled wheels)
openai==1.3.0
scikit-learn>=1.3.0,<1.4.0  # Use compatible version
numpy>=1.24.0,<1.25.0
pandas>=2.1.0,<2.2.0
shap>=0.43.0,<0.44.0

# Data processing and validation
pydantic==2.5.0
httpx==0.25.2
aiofiles==23.2.1

# Logging and monitoring
structlog==23.2.0
rich==13.7.0

# Testing (optional for development)
pytest==7.4.3
pytest-asyncio==0.21.1

# Development tools
black==23.11.0
isort==5.12.0
flake8==6.1.0
EOF

    print_success "Created requirements-macos.txt"
    print_info "Install with: pip install -r requirements-macos.txt"
}

# Main menu
echo "Choose a solution:"
echo "1. Install with conda (recommended for macOS)"
echo "2. Install OpenMP support via Homebrew"
echo "3. Use pre-compiled wheels only"
echo "4. Create macOS-compatible requirements.txt"
echo "5. Try all solutions in order"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        install_with_conda
        ;;
    2)
        install_with_openmp
        ;;
    3)
        install_with_precompiled
        ;;
    4)
        create_fixed_requirements
        ;;
    5)
        print_info "Trying all solutions..."
        create_fixed_requirements
        if ! install_with_precompiled; then
            print_warning "Pre-compiled wheels failed, trying OpenMP..."
            if ! install_with_openmp; then
                print_warning "OpenMP failed, trying conda..."
                install_with_conda
            fi
        fi
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Installation fix complete!"
echo ""
echo "Next steps:"
echo "1. Navigate to the backend directory: cd backend"
echo "2. Activate your environment:"
if [[ $choice == 1 ]]; then
    echo "   conda activate orbit"
else
    echo "   source venv/bin/activate"
fi
echo "3. Start the backend: uvicorn main:app --reload"
echo ""
echo "If you still encounter issues, try:"
echo "• Restart your terminal"
echo "• Update Xcode command line tools: xcode-select --install"
echo "• Use Python 3.11 specifically: python3.11 -m venv venv"