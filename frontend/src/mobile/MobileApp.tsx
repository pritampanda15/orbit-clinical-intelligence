// src/mobile/MobileApp.tsx - Progressive Web App for OR-BIT Mobile
import React, { useState, useEffect } from 'react';

interface MobileAppProps {
  isMobile: boolean;
}

export const MobileApp: React.FC<MobileAppProps> = ({ isMobile }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'patient' | 'alerts' | 'profile'>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Fetch data from API
    const fetchData = async () => {
      try {
        // In a real app, this would fetch from your OR-BIT API
        const mockPatients = [
          {
            id: 'PAT-001',
            name: 'John Smith',
            room: 'OR-1',
            status: 'STABLE',
            vitals: { MAP: 75, HR: 80, SpO2: 98 },
            alerts: 0
          },
          {
            id: 'PAT-002', 
            name: 'Maria Garcia',
            room: 'OR-2',
            status: 'CRITICAL',
            vitals: { MAP: 58, HR: 105, SpO2: 94 },
            alerts: 2
          }
        ];
        
        setPatients(mockPatients);
        
        // Mock alerts
        setAlerts([
          {
            id: 'ALT-001',
            patientId: 'PAT-002',
            type: 'HYPOTENSION',
            severity: 'HIGH',
            message: 'MAP dropped to 58 mmHg',
            timestamp: new Date()
          }
        ]);
        
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const renderDashboard = () => (
    <div className="p-4 space-y-4">
      {/* Status Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
        <h1 className="text-xl font-bold">OR-BIT Mobile</h1>
        <p className="text-sm opacity-90">
          {patients.length} patients • {alerts.filter(a => a.severity === 'HIGH').length} critical alerts
        </p>
        <div className="flex items-center mt-2">
          <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(a => a.severity === 'HIGH').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="font-bold text-red-800 mb-2">🚨 Critical Alerts</h2>
          {alerts.filter(a => a.severity === 'HIGH').map(alert => (
            <div key={alert.id} className="text-sm text-red-700 mb-1">
              {alert.message} - {alert.patientId}
            </div>
          ))}
        </div>
      )}

      {/* Patient List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Active Patients</h2>
        {patients.map(patient => (
          <div
            key={patient.id}
            className={`p-4 rounded-lg border-2 transition-all ${
              patient.status === 'CRITICAL' ? 'border-red-300 bg-red-50' :
              patient.status === 'WARNING' ? 'border-yellow-300 bg-yellow-50' :
              'border-green-300 bg-green-50'
            }`}
            onClick={() => {
              setSelectedPatient(patient);
              setCurrentView('patient');
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-gray-900">{patient.name}</h3>
                <p className="text-sm text-gray-600">Room {patient.room}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                patient.status === 'CRITICAL' ? 'bg-red-500 text-white' :
                patient.status === 'WARNING' ? 'bg-yellow-500 text-black' :
                'bg-green-500 text-white'
              }`}>
                {patient.status}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-bold">{patient.vitals.MAP}</div>
                <div className="text-xs text-gray-600">MAP</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{patient.vitals.HR}</div>
                <div className="text-xs text-gray-600">HR</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{patient.vitals.SpO2}%</div>
                <div className="text-xs text-gray-600">SpO₂</div>
              </div>
            </div>
            
            {patient.alerts > 0 && (
              <div className="mt-2 text-xs text-red-600">
                {patient.alerts} active alert{patient.alerts > 1 ? 's' : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPatientDetail = () => {
    if (!selectedPatient) return null;

    return (
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="p-2 bg-gray-100 rounded-full"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold">{selectedPatient.name}</h1>
            <p className="text-gray-600">Room {selectedPatient.room}</p>
          </div>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-lg ${
          selectedPatient.status === 'CRITICAL' ? 'bg-red-50 border border-red-200' :
          selectedPatient.status === 'WARNING' ? 'bg-yellow-50 border border-yellow-200' :
          'bg-green-50 border border-green-200'
        }`}>
          <h2 className="font-bold mb-2">Current Status</h2>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
            selectedPatient.status === 'CRITICAL' ? 'bg-red-500 text-white' :
            selectedPatient.status === 'WARNING' ? 'bg-yellow-500 text-black' :
            'bg-green-500 text-white'
          }`}>
            {selectedPatient.status}
          </div>
        </div>

        {/* Vitals */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-bold mb-3">Current Vitals</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">{selectedPatient.vitals.MAP}</div>
              <div className="text-sm text-gray-600">MAP (mmHg)</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">{selectedPatient.vitals.HR}</div>
              <div className="text-sm text-gray-600">HR (bpm)</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">{selectedPatient.vitals.SpO2}%</div>
              <div className="text-sm text-gray-600">SpO₂</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">16</div>
              <div className="text-sm text-gray-600">RR (/min)</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="font-bold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-2xl mb-1">📞</div>
              <div className="text-sm font-medium">Call Team</div>
            </button>
            <button className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-center">
              <div className="text-2xl mb-1">📝</div>
              <div className="text-sm font-medium">Add Note</div>
            </button>
            <button className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-sm font-medium">Acknowledge</div>
            </button>
            <button className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
              <div className="text-2xl mb-1">🚨</div>
              <div className="text-sm font-medium">Emergency</div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAlerts = () => (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Alerts & Notifications</h1>
      
      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-2 ${
                alert.severity === 'HIGH' ? 'border-red-300 bg-red-50' :
                'border-yellow-300 bg-yellow-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-gray-900">{alert.type}</div>
                <div className="text-xs text-gray-500">
                  {alert.timestamp.toLocaleTimeString()}
                </div>
              </div>
              <div className="text-sm text-gray-700 mb-2">
                {alert.message}
              </div>
              <div className="text-xs text-gray-600">
                Patient: {alert.patientId}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <div>No active alerts</div>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Profile & Settings</h1>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-bold mb-3">User Information</h2>
        <div className="space-y-2 text-sm">
          <div>Dr. Sarah Johnson</div>
          <div className="text-gray-600">Anesthesiologist</div>
          <div className="text-gray-600">Stanford Medical Center</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-bold mb-3">Notification Settings</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Critical Alerts</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Push Notifications</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Sound Alerts</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-bold mb-3">App Information</h2>
        <div className="space-y-1 text-sm text-gray-600">
          <div>Version: 1.0.0</div>
          <div>Last Update: Today</div>
          <div>Server: Connected</div>
        </div>
      </div>
    </div>
  );

  const renderBottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="grid grid-cols-4 py-2">
        {[
          { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
          { id: 'patient', icon: '👤', label: 'Patient' },
          { id: 'alerts', icon: '🚨', label: 'Alerts' },
          { id: 'profile', icon: '⚙️', label: 'Profile' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as any)}
            className={`flex flex-col items-center py-2 ${
              currentView === item.id ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <div className="text-lg">{item.icon}</div>
            <div className="text-xs">{item.label}</div>
            {item.id === 'alerts' && alerts.filter(a => a.severity === 'HIGH').length > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {alerts.filter(a => a.severity === 'HIGH').length}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Main Content */}
      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'patient' && renderPatientDetail()}
      {currentView === 'alerts' && renderAlerts()}
      {currentView === 'profile' && renderProfile()}
      
      {/* Bottom Navigation */}
      {renderBottomNavigation()}
    </div>
  );
};

// PWA Service Worker Registration
export const registerPWA = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// PWA Manifest and Service Worker files would be:

// public/manifest.json
export const PWA_MANIFEST = {
  "name": "OR-BIT Mobile",
  "short_name": "OR-BIT",
  "description": "Operating Room Bio-Intelligence Twin Mobile App",
  "start_url": "/mobile",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png", 
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128", 
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
};

// public/sw.js (Service Worker)
export const SERVICE_WORKER_CODE = `
const CACHE_NAME = 'orbit-mobile-v1';
const urlsToCache = [
  '/',
  '/mobile',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New OR-BIT notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'orbit-notification',
    vibrate: [200, 100, 200],
    data: {
      url: '/mobile'
    }
  };

  event.waitUntil(
    self.registration.showNotification('OR-BIT Alert', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/mobile')
  );
});
`;

// Hook for mobile detection
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(userAgent) || window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};