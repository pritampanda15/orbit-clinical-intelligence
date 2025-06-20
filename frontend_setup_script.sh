#!/bin/bash

# OR-BIT Frontend Complete Setup Script
# This creates the entire Next.js frontend from scratch

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [[ ! -d "backend" ]]; then
    echo "Please run this script from the orbit-clinical-ai root directory"
    exit 1
fi

print_info "Setting up OR-BIT Frontend..."

# Create frontend directory
mkdir -p frontend
cd frontend

# Create package.json
print_info "Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "orbit-frontend",
  "version": "1.0.0",
  "description": "OR-BIT Clinical Intelligence Dashboard",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "classnames": "^2.3.2",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.0",
    "@tailwindcss/typography": "^0.5.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF

# Create Next.js configuration
print_info "Creating next.config.js..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // API Proxying to FastAPI backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_BASE 
          ? `${process.env.NEXT_PUBLIC_API_BASE}/:path*`
          : 'http://127.0.0.1:8000/:path*',
      },
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-chartjs-2', 'chart.js'],
  },

  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
EOF

# Create Tailwind configuration
print_info "Creating tailwind.config.js..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        critical: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
};
EOF

# Create PostCSS configuration
print_info "Creating postcss.config.js..."
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# Create TypeScript configuration
print_info "Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# Create environment file
print_info "Creating .env.local..."
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
EOF

# Create ESLint configuration
print_info "Creating .eslintrc.json..."
cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
EOF

# Create directory structure
print_info "Creating directory structure..."
mkdir -p src/pages
mkdir -p src/components
mkdir -p src/styles
mkdir -p public

# Create global styles
print_info "Creating global styles..."
cat > src/styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: Inter, system-ui, sans-serif;
  }
  
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }
}

@layer components {
  .medical-card {
    @apply bg-white rounded-xl shadow-lg border border-gray-200;
  }
  
  .vital-normal {
    @apply text-green-600 bg-green-50 border-green-200;
  }
  
  .vital-warning {
    @apply text-yellow-600 bg-yellow-50 border-yellow-200;
  }
  
  .vital-critical {
    @apply text-red-600 bg-red-50 border-red-200;
  }
}

/* Chart.js responsive styling */
.chart-container {
  position: relative;
  height: 100%;
  width: 100%;
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
EOF

# Create _app.tsx
print_info "Creating _app.tsx..."
cat > src/pages/_app.tsx << 'EOF'
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
EOF

# Create simple index page for now
print_info "Creating index.tsx..."
cat > src/pages/index.tsx << 'EOF'
import Head from 'next/head';
import { useState, useEffect } from 'react';

interface VitalsData {
  timestamp: string;
  MAP: number;
  HR: number;
  SpO2: number;
  RR: number;
  Temp: number;
  EtCO2: number;
  BIS?: number;
}

export default function Home() {
  const [vitals, setVitals] = useState<VitalsData[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    // Test backend connection
    const testConnection = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          setStatus('connected');
          // Fetch initial vitals
          const vitalsResponse = await fetch('/api/vitals');
          if (vitalsResponse.ok) {
            const vitalsData = await vitalsResponse.json();
            setVitals(vitalsData);
          }
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Connection error:', error);
        setStatus('error');
      }
    };

    testConnection();
    const interval = setInterval(testConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'Connected to OR-BIT Backend';
      case 'connecting': return 'Connecting to Backend...';
      case 'error': return 'Backend Connection Failed';
    }
  };

  return (
    <>
      <Head>
        <title>OR-BIT - Clinical Intelligence Dashboard</title>
        <meta name="description" content="Operating Room Bio-Intelligence Twin" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">OR</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">OR-BIT</h1>
                <span className="text-sm text-gray-500">Clinical Intelligence</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {status === 'connected' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Backend</span>
                    <span className="text-green-600 font-medium">✅ Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Data Stream</span>
                    <span className="text-green-600 font-medium">✅ Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">AI Models</span>
                    <span className="text-green-600 font-medium">✅ Loaded</span>
                  </div>
                </div>
              </div>

              {/* Latest Vitals */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Vitals</h2>
                {vitals.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(vitals[vitals.length - 1]).map(([key, value]) => {
                      if (key === 'timestamp') return null;
                      return (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-700">{key}</div>
                          <div className="text-lg font-bold text-gray-900">
                            {typeof value === 'number' ? value.toFixed(1) : value || 'N/A'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">Loading vitals data...</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className="p-4 text-center bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">📊</div>
                    <div className="text-sm font-medium">View Charts</div>
                  </button>
                  <button className="p-4 text-center bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">🤖</div>
                    <div className="text-sm font-medium">AI Chat</div>
                  </button>
                  <button className="p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">🔮</div>
                    <div className="text-sm font-medium">Forecasting</div>
                  </button>
                  <button className="p-4 text-center bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">🚨</div>
                    <div className="text-sm font-medium">Alerts</div>
                  </button>
                </div>
              </div>
            </div>
          ) : status === 'error' ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔌</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Backend Connection Failed</h2>
              <p className="text-gray-600 mb-6">
                Make sure the backend is running on port 8000
              </p>
              <div className="bg-gray-100 rounded-lg p-4 text-left max-w-lg mx-auto">
                <p className="text-sm text-gray-700 mb-2">To start the backend:</p>
                <code className="text-xs bg-white p-2 rounded block">
                  cd backend && source venv/bin/activate && uvicorn main:app --reload
                </code>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-spin">⚕️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Connecting to OR-BIT</h2>
              <p className="text-gray-600">Establishing connection with clinical intelligence backend...</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
EOF

# Create gitignore
print_info "Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF

print_success "Frontend setup complete!"
print_info "Installing dependencies..."

# Install dependencies
npm install

print_success "All dependencies installed!"

echo ""
echo "🎉 Frontend setup complete!"
echo ""
echo "To start the frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Access the dashboard at: http://localhost:3000"
echo ""
