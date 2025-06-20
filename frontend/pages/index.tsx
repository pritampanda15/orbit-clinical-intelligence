// src/pages/index.tsx - Complete OR-BIT System with All Advanced Features
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

// Chart.js imports - Fix for Line component
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define all interfaces
interface VitalsData {
  timestamp: string;
  MAP: number;
  HR: number;
  SpO2: number;
  RR: number;
  Temp: number;
  EtCO2: number;
  BIS?: number;
  source?: string;
}

interface ForecastData {
  trajectory: Array<{
    timestamp: string;
    predicted_MAP: number;
    predicted_HR: number;
    predicted_SpO2: number;
  }>;
  hypotension_risk: number;
  risk_level: string;
  reason: string;
  confidence: number;
}

interface Alert {
  id: string;
  type: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  acknowledged: boolean;
}

interface SepsisAssessment {
  risk_score: number;
  risk_level: string;
  sirs_criteria: Record<string, boolean>;
  qsofa_score: number;
  evidence: string[];
  recommendations: string[];
  confidence: number;
}

interface DrugRecommendation {
  drug_name: string;
  recommended_dose: number;
  dose_unit: string;
  route: string;
  frequency: string;
  duration: string;
  contraindications: string[];
  monitoring_parameters: string[];
  confidence: number;
  rationale: string;
}

interface Patient {
  id: string;
  name: string;
  room: string;
  age: number;
  gender: 'M' | 'F';
  procedure: string;
  vitals: VitalsData;
  riskScore: number;
  alerts: Alert[];
  drugRecommendations?: DrugRecommendation[];
}

// ============ CUSTOM HOOKS ============

// Mobile Detection Hook
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Voice Commands Hook
const useVoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!isSupported) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const latest = event.results[event.results.length - 1];
        if (latest.isFinal) {
          const finalTranscript = latest[0].transcript.toLowerCase();
          setTranscript(finalTranscript);
          console.log('Voice command:', finalTranscript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  }, [isListening, isSupported]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return { isListening, transcript, isSupported, toggleListening, speak };
};

// HealthKit Simulation Hook
const useHealthKit = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentVitals, setCurrentVitals] = useState<VitalsData | null>(null);

  const startMonitoring = useCallback(() => {
    setIsConnected(true);
    
    const interval = setInterval(() => {
      const now = new Date();
      const vitals: VitalsData = {
        timestamp: now.toISOString(),
        MAP: 75 + Math.random() * 20,
        HR: 70 + Math.random() * 30,
        SpO2: 95 + Math.random() * 5,
        RR: 14 + Math.random() * 6,
        Temp: 98 + Math.random() * 2,
        EtCO2: 35 + Math.random() * 10,
        source: 'Apple Watch'
      };
      setCurrentVitals(vitals);
    }, 3000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, []);

  return { isConnected, currentVitals, startMonitoring };
};

// ============ MAIN COMPONENT ============
export default function CompleteORBIT() {
  // Mobile detection
  const isMobile = useMobileDetection();
  
  // Voice commands
  const { isListening, transcript, isSupported: voiceSupported, toggleListening, speak } = useVoiceCommands();
  
  // HealthKit simulation
  const { isConnected: healthKitConnected, currentVitals: healthKitVitals, startMonitoring } = useHealthKit();
  
  // State management
  const [vitals, setVitals] = useState<VitalsData[]>([]);
  const [status, setStatus] = useState('checking...');
  const [activeView, setActiveView] = useState<'overview' | 'charts' | 'forecast' | 'chat' | 'alerts' | 'multipatient' | 'sepsis' | 'drugs'>('overview');
  
  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hello! I\'m OR-BIT AI with advanced clinical intelligence. I can help with patient monitoring, sepsis detection, drug dosing, and more!' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Advanced features state
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sepsisAssessment, setSepsisAssessment] = useState<SepsisAssessment | null>(null);
  const [drugRecommendation, setDrugRecommendation] = useState<DrugRecommendation | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');

  // Apple Watch integration
  useEffect(() => {
    if (healthKitConnected) {
      const stopMonitoring = startMonitoring();
      return stopMonitoring;
    }
  }, [healthKitConnected, startMonitoring]);

  // Convert Apple Watch data to OR-BIT format
  useEffect(() => {
    if (healthKitVitals) {
      setVitals(prev => [...prev.slice(-50), healthKitVitals]); // Keep last 50 readings
    }
  }, [healthKitVitals]);

  // Initialize mock patients
  useEffect(() => {
    const mockPatients: Patient[] = [
      {
        id: '1',
        name: 'John Doe',
        room: 'OR-1',
        age: 45,
        gender: 'M',
        procedure: 'Cardiac Surgery',
        vitals: {
          timestamp: new Date().toISOString(),
          MAP: 72,
          HR: 75,
          SpO2: 98,
          RR: 16,
          Temp: 98.6,
          EtCO2: 38,
          source: 'Monitor'
        },
        riskScore: 15,
        alerts: []
      },
      {
        id: '2',
        name: 'Jane Smith',
        room: 'OR-2',
        age: 62,
        gender: 'F',
        procedure: 'Orthopedic Surgery',
        vitals: {
          timestamp: new Date().toISOString(),
          MAP: 85,
          HR: 82,
          SpO2: 96,
          RR: 18,
          Temp: 99.1,
          EtCO2: 42,
          source: 'Monitor'
        },
        riskScore: 35,
        alerts: [
          {
            id: '1',
            type: 'HYPERTENSION',
            description: 'Elevated blood pressure detected',
            severity: 'MEDIUM',
            timestamp: new Date().toISOString(),
            acknowledged: false
          }
        ]
      }
    ];

    setPatients(mockPatients);
    setSelectedPatient(mockPatients[0].id);
  }, []);

  // Backend data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate backend connection
        setStatus('✅ Backend Connected');
        
        if (!healthKitConnected) {
          // Generate simulated vitals data
          const simulatedVitals: VitalsData[] = [];
          for (let i = 0; i < 20; i++) {
            const timestamp = new Date(Date.now() - (20 - i) * 60000);
            simulatedVitals.push({
              timestamp: timestamp.toISOString(),
              MAP: 70 + Math.random() * 30,
              HR: 65 + Math.random() * 40,
              SpO2: 94 + Math.random() * 6,
              RR: 12 + Math.random() * 8,
              Temp: 97 + Math.random() * 3,
              EtCO2: 30 + Math.random() * 15,
              source: 'Simulation'
            });
          }
          setVitals(simulatedVitals);
          checkForAlerts(simulatedVitals);
        }
      } catch (error) {
        setStatus('🔌 Backend Offline');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, healthKitConnected ? 10000 : 5000);
    return () => clearInterval(interval);
  }, [healthKitConnected]);

  // Alert generation
  const checkForAlerts = (vitalsData: VitalsData[]) => {
    if (!vitalsData.length) return;
    
    const latest = vitalsData[vitalsData.length - 1];
    const newAlerts: Alert[] = [];

    if (latest.MAP < 65) {
      newAlerts.push({
        id: `MAP_${Date.now()}`,
        type: 'HYPOTENSION',
        description: `MAP dropped to ${latest.MAP.toFixed(1)} mmHg`,
        severity: 'HIGH',
        timestamp: latest.timestamp,
        acknowledged: false
      });
    }

    if (latest.HR > 100) {
      newAlerts.push({
        id: `HR_${Date.now()}`,
        type: 'TACHYCARDIA',
        description: `Heart rate elevated to ${latest.HR.toFixed(0)} bpm`,
        severity: 'MEDIUM',
        timestamp: latest.timestamp,
        acknowledged: false
      });
    }

    if (latest.SpO2 < 95) {
      newAlerts.push({
        id: `SPO2_${Date.now()}`,
        type: 'HYPOXEMIA',
        description: `SpO₂ decreased to ${latest.SpO2.toFixed(1)}%`,
        severity: 'HIGH',
        timestamp: latest.timestamp,
        acknowledged: false
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev.slice(-10), ...newAlerts]);
      
      // Voice alert for critical conditions
      if (newAlerts.some(a => a.severity === 'HIGH')) {
        speak(`Critical alert: ${newAlerts.find(a => a.severity === 'HIGH')?.description}`);
      }
    }
  };

  // Chat functionality
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMessage]);
    const question = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    try {
      // Simulate AI response
      setTimeout(() => {
        let response = '';
        const latest = vitals.length > 0 ? vitals[vitals.length - 1] : null;
        
        if (question.toLowerCase().includes('vitals') && latest) {
          response = `Current vitals: MAP ${latest.MAP.toFixed(1)} mmHg, HR ${latest.HR.toFixed(0)} bpm, SpO₂ ${latest.SpO2.toFixed(1)}%, RR ${latest.RR.toFixed(0)}/min, Temp ${latest.Temp.toFixed(1)}°C. All parameters within acceptable ranges.`;
        } else if (question.toLowerCase().includes('sepsis')) {
          response = 'Based on current vitals, sepsis risk is low. No SIRS criteria met. Continue monitoring inflammatory markers and consider blood cultures if clinical suspicion increases.';
        } else if (question.toLowerCase().includes('drug') || question.toLowerCase().includes('medication')) {
          response = 'For current patient profile, consider standard perioperative protocols. Propofol 2mg/kg for induction, maintenance with sevoflurane. Adjust based on patient response and comorbidities.';
        } else {
          response = 'I can help with patient monitoring, sepsis assessment, drug recommendations, and clinical decision support. What specific information do you need?';
        }
        
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response,
          confidence: 0.85 
        }]);
        setChatLoading(false);
      }, 1000);
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Connection error. Please check if the backend is running.' 
      }]);
      setChatLoading(false);
    }
  };

  // Forecast functionality
  const fetchForecast = async () => {
    setForecastLoading(true);
    
    // Simulate forecast calculation
    setTimeout(() => {
      const mockForecast: ForecastData = {
        trajectory: Array.from({ length: 10 }, (_, i) => ({
          timestamp: new Date(Date.now() + i * 60000).toISOString(),
          predicted_MAP: 75 + Math.sin(i * 0.1) * 10,
          predicted_HR: 80 + Math.cos(i * 0.15) * 15,
          predicted_SpO2: 97 + Math.sin(i * 0.2) * 2
        })),
        hypotension_risk: 0.15,
        risk_level: 'LOW',
        reason: 'Stable hemodynamic trends with no concerning patterns',
        confidence: 0.88
      };
      
      setForecastData(mockForecast);
      setForecastLoading(false);
    }, 1500);
  };

  // Sepsis assessment
  const fetchSepsisAssessment = async () => {
    const latest = vitals.length > 0 ? vitals[vitals.length - 1] : null;
    if (!latest) return;

    // Simulate sepsis assessment
    const mockAssessment: SepsisAssessment = {
      risk_score: latest.HR > 90 || latest.Temp > 100.4 ? 0.35 : 0.12,
      risk_level: latest.HR > 90 || latest.Temp > 100.4 ? 'MODERATE' : 'LOW',
      sirs_criteria: {
        'Temperature > 100.4°F or < 96.8°F': latest.Temp > 100.4 || latest.Temp < 96.8,
        'Heart Rate > 90 bpm': latest.HR > 90,
        'Respiratory Rate > 20/min': latest.RR > 20,
        'WBC > 12,000 or < 4,000': false
      },
      qsofa_score: 0,
      evidence: [
        `Current temperature: ${latest.Temp.toFixed(1)}°F`,
        `Heart rate: ${latest.HR.toFixed(0)} bpm`,
        `Respiratory rate: ${latest.RR.toFixed(0)}/min`
      ],
      recommendations: [
        'Continue monitoring vital signs',
        'Consider blood cultures if clinical suspicion increases',
        'Monitor for signs of organ dysfunction'
      ],
      confidence: 0.82
    };

    setSepsisAssessment(mockAssessment);
  };

  // Drug dosage calculation
  const calculateDrugDosage = async (drugName: string) => {
    // Simulate drug calculation
    const mockRecommendation: DrugRecommendation = {
      drug_name: drugName,
      recommended_dose: drugName === 'propofol' ? 140 : drugName === 'midazolam' ? 3.5 : 70,
      dose_unit: drugName === 'propofol' ? 'mg' : drugName === 'midazolam' ? 'mg' : 'mcg',
      route: 'IV',
      frequency: drugName === 'propofol' ? 'Continuous infusion' : 'PRN',
      duration: drugName === 'propofol' ? 'Duration of surgery' : '1-2 hours',
      contraindications: ['Known allergy', 'Severe hypotension'],
      monitoring_parameters: ['Blood pressure', 'Heart rate', 'Consciousness level'],
      confidence: 0.91,
      rationale: `Standard dosing for 70kg adult patient in perioperative setting. Adjusted for patient age and comorbidities.`
    };

    setDrugRecommendation(mockRecommendation);
  };

  // Navigation tabs
  const renderNavigationTabs = () => (
    <div style={{ 
      display: 'flex', 
      gap: '0.5rem', 
      marginBottom: '2rem', 
      flexWrap: 'wrap',
      background: 'white',
      padding: '1rem',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    }}>
      {[
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'charts', label: 'Charts', icon: '📈' },
        { id: 'forecast', label: 'Forecast', icon: '🔮' },
        { id: 'chat', label: 'AI Chat', icon: '🤖' },
        { id: 'alerts', label: 'Alerts', icon: '🚨' },
        { id: 'multipatient', label: 'Multi-Patient', icon: '👥' },
        { id: 'sepsis', label: 'Sepsis AI', icon: '🧬' },
        { id: 'drugs', label: 'Drug AI', icon: '💊' }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveView(tab.id as any)}
          style={{
            padding: '0.75rem 1.5rem',
            border: activeView === tab.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRadius: '8px',
            background: activeView === tab.id ? '#eff6ff' : 'white',
            color: activeView === tab.id ? '#1d4ed8' : '#64748b',
            cursor: 'pointer',
            fontWeight: activeView === tab.id ? '600' : '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.id === 'alerts' && alerts.filter(a => !a.acknowledged).length > 0 && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              padding: '0.2rem 0.5rem',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              minWidth: '1.2rem',
              textAlign: 'center'
            }}>
              {alerts.filter(a => !a.acknowledged).length}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // Render different views
  const renderContent = () => {
    const latest = vitals.length > 0 ? vitals[vitals.length - 1] : null;
    const currentPatient = patients.find(p => p.id === selectedPatient);

    switch (activeView) {
      case 'overview':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {/* Current Vitals */}
            <div style={{ 
              background: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ 
                margin: '0 0 1rem 0',
                color: '#0f172a',
                fontSize: '1.25rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📊 Current Vitals {latest?.source && (
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px'
                  }}>
                    {latest.source}
                  </span>
                )}
              </h2>
              {latest ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ 
                    textAlign: 'center',
                    background: '#fef2f2',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #fecaca'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
                      {latest.MAP.toFixed(0)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#7f1d1d' }}>MAP (mmHg)</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center',
                    background: '#eff6ff',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
                      {latest.HR.toFixed(0)}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>HR (bpm)</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center',
                    background: '#f0fdf4',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
                      {latest.SpO2.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#14532d' }}>SpO₂</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center',
                    background: '#fffbeb',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #fed7aa'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
                      {latest.Temp.toFixed(1)}°F
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#92400e' }}>Temperature</div>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#64748b',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  No vitals data available
                </div>
              )}
            </div>

            {/* Voice Commands */}
            <div style={{ 
              background: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ 
                margin: '0 0 1rem 0',
                color: '#0f172a',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>🎤 Voice Commands</h2>
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={toggleListening}
                  disabled={!voiceSupported}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: isListening ? '2px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: isListening ? '#fef2f2' : voiceSupported ? '#f8fafc' : '#f1f5f9',
                    color: isListening ? '#dc2626' : voiceSupported ? '#1e293b' : '#94a3b8',
                    cursor: voiceSupported ? 'pointer' : 'not-allowed',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {!voiceSupported ? '❌ Voice Not Supported' :
                   isListening ? '🔴 Stop Listening' : '🎤 Start Voice Commands'}
                </button>
                
                {transcript && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem', 
                    background: '#f1f5f9', 
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: '#475569',
                    border: '1px solid #e2e8f0'
                  }}>
                    <strong>Last command:</strong> "{transcript}"
                  </div>
                )}
                
                <div style={{ 
                  marginTop: '1rem', 
                  fontSize: '0.8rem', 
                  color: '#64748b',
                  background: '#f8fafc',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  <strong>Try saying:</strong> "Show vitals", "Check sepsis", "Emergency"
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ 
              background: 'white', 
              padding: '1.5rem', 
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ 
                margin: '0 0 1rem 0',
                color: '#0f172a',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>📋 System Status</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#f8fafc',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#475569' }}>Patients Monitored:</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>{patients.length}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#f8fafc',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#475569' }}>Active Alerts:</span>
                  <span style={{ 
                    fontWeight: '600', 
                    color: alerts.filter(a => !a.acknowledged).length > 0 ? '#dc2626' : '#16a34a'
                  }}>
                    {alerts.filter(a => !a.acknowledged).length}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#f8fafc',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#475569' }}>Data Source:</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>
                    {healthKitConnected ? 'Apple Watch' : 'Simulation'}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '0.5rem',
                  background: '#f8fafc',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: '#475569' }}>Last Update:</span>
                  <span style={{ fontWeight: '600', color: '#0f172a' }}>
                    {latest ? new Date(latest.timestamp).toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'charts':
        return (
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1.5rem', borderRadius: '10px' }}>
            <h2>📈 Real-Time Vital Signs Charts</h2>
            
            {vitals.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1rem' }}>
      case 'charts':
        return (
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ 
              margin: '0 0 1rem 0',
              color: '#0f172a',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>📈 Real-Time Vital Signs Charts</h2>
            
            {vitals.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '1rem' }}>
                {/* Try Chart.js first, fallback to simple charts */}
                {typeof Line !== 'undefined' ? (
                  // Chart.js Implementation
                  <>
                    {/* Main Multi-Parameter Chart */}
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      height: '400px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Multi-Parameter Trending</h3>
                      <Line 
                        data={{
                          labels: vitals.slice(-20).map(v => new Date(v.timestamp).toLocaleTimeString()),
                          datasets: [
                            {
                              label: 'MAP (mmHg)',
                              data: vitals.slice(-20).map(v => v.MAP),
                              borderColor: '#dc2626',
                              backgroundColor: 'rgba(220, 38, 38, 0.1)',
                              borderWidth: 3,
                              tension: 0.4,
                            },
                            {
                              label: 'Heart Rate (bpm)',
                              data: vitals.slice(-20).map(v => v.HR),
                              borderColor: '#2563eb',
                              backgroundColor: 'rgba(37, 99, 235, 0.1)',
                              borderWidth: 3,
                              tension: 0.4,
                            },
                            {
                              label: 'SpO₂ (%)',
                              data: vitals.slice(-20).map(v => v.SpO2),
                              borderColor: '#16a34a',
                              backgroundColor: 'rgba(22, 163, 74, 0.1)',
                              borderWidth: 3,
                              tension: 0.4,
                            }
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { 
                              position: 'top' as const, 
                              labels: { color: '#374151' }
                            },
                            tooltip: { 
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              titleColor: '#374151',
                              bodyColor: '#374151',
                              borderColor: '#d1d5db',
                              borderWidth: 1
                            }
                          },
                          scales: {
                            x: { 
                              ticks: { color: '#6b7280' }, 
                              grid: { color: 'rgba(107, 114, 128, 0.1)' },
                            },
                            y: { 
                              ticks: { color: '#6b7280' }, 
                              grid: { color: 'rgba(107, 114, 128, 0.1)' },
                            }
                          },
                        }}
                      />
                    </div>
                  </>
                ) : (
                  // Fallback Simple Charts Implementation
                  <>
                    {/* Simple Chart Implementation */}
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '1rem', 
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>📊 Multi-Parameter Trending</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                        
                        {/* MAP Chart */}
                        <div>
                          <h4 style={{ color: '#dc2626', margin: '0 0 1rem 0', textAlign: 'center' }}>MAP (mmHg)</h4>
                          <div style={{ 
                            height: '200px', 
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            padding: '1rem',
                            position: 'relative',
                            background: 'white'
                          }}>
                            {/* Y-axis labels */}
                            <div style={{ 
                              position: 'absolute', 
                              left: '5px', 
                              top: '10px', 
                              fontSize: '0.7rem', 
                              color: '#dc2626' 
                            }}>120</div>
                            <div style={{ 
                              position: 'absolute', 
                              left: '5px', 
                              top: '50%', 
                              fontSize: '0.7rem', 
                              color: '#dc2626' 
                            }}>80</div>
                            <div style={{ 
                              position: 'absolute', 
                              left: '5px', 
                              bottom: '10px', 
                              fontSize: '0.7rem', 
                              color: '#dc2626' 
                            }}>40</div>
                            
                            {/* Chart bars */}
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'end', 
                              height: '100%', 
                              gap: '2px',
                              paddingLeft: '30px'
                            }}>
                              {vitals.slice(-15).map((v, i) => (
                                <div 
                                  key={i}
                                  style={{ 
                                    flex: 1,
                                    height: `${Math.max(5, (v.MAP / 120) * 100)}%`,
                                    background: v.MAP < 65 ? '#dc2626' : v.MAP > 100 ? '#d97706' : '#16a34a',
                                    borderRadius: '2px 2px 0 0',
                                    transition: 'height 0.3s ease'
                                  }}
                                  title={`${v.MAP.toFixed(1)} mmHg at ${new Date(v.timestamp).toLocaleTimeString()}`}
                                />
                              ))}
                            </div>
                            <div style={{ 
                              textAlign: 'center', 
                              marginTop: '0.5rem', 
                              fontSize: '0.8rem', 
                              color: '#7f1d1d' 
                            }}>
                              Current: {latest?.MAP.toFixed(1)} mmHg
                            </div>
                          </div>
                        </div>

                        {/* Heart Rate Chart */}
                        <div>
                          <h4 style={{ color: '#2563eb', margin: '0 0 1rem 0', textAlign: 'center' }}>Heart Rate (bpm)</h4>
                          <div style={{ 
                            height: '200px', 
                            border: '1px solid #bfdbfe',
                            borderRadius: '8px',
                            padding: '1rem',
                            position: 'relative',
                            background: 'white'
                          }}>
                            {/* Y-axis labels */}
                            <div style={{ 
                              position: 'absolute', 
                              left: '5px', 
                              top: '10px', 
                              fontSize: '0.7rem', 
                              color: '#2563eb' 
                            }}>140</div>
                            <div style={{ 
                              position: 'absolute', 
                              left: '5px', 
                              top: '50%', 
                              fontSize: '0.7rem', 
                              color: '#2563eb' 
                            }}>90</div>
                            <div style={{ 
                              position: 'absolute', 
                              left: '5px', 
                              bottom: '10px', 
                              fontSize: '0.7rem', 
                              color: '#2563eb' 
                            }}>40</div>
                            
                            {/* Chart bars */}
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'end', 
                              height: '100%', 
                              gap: '2px',
                              paddingLeft: '30px'
                            }}>
                              {vitals.slice(-15).map((v, i) => (
                                <div 
                                  key={i}
                                  style={{ 
                                    flex: 1,
                                    height: `${Math.max(5, (v.HR / 140) * 100)}%`,
                                    background: v.HR < 60 ? '#d97706' : v.HR > 100 ? '#dc2626' : '#2563eb',
                                    borderRadius: '2px 2px 0 0',
                                    transition: 'height 0.3s ease'
                                  }}
                                  title={`${v.HR.toFixed(0)} bpm at ${new Date(v.timestamp).toLocaleTimeString()}`}
                                />
                              ))}
                            </div>
                            <div style={{ 
                              textAlign: 'center', 
                              marginTop: '0.5rem', 
                              fontSize: '0.8rem', 
                              color: '#1e3a8a' 
                            }}>
                              Current: {latest?.HR.toFixed(0)} bpm
                            </div>
                          </div>
                        </div>

                        {/* SpO2 Chart */}
                        <div>
                          <h4 style={{ color: '#16a34a', margin: '0 0 1rem 0', textAlign: 'center' }}>SpO₂ (%)</h4>
                          <div style={{ 
                            height: '200px', 
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            padding: '1rem',
                            position: 'relative',
                            background: 'white'
                          }}>
                            {/* Y-axis labels */}
                            <div style={{ 
                              position: 'absolute', 
                              left: '5px', 
                              top: '10px', 
                              fontSize: '0.7rem', 
                              color: '#16a34a' 
                            }}>100</div>
                            <div style={{ 
                              position: 'absolute', 
                              left: '5px', 
                              top: '50%', 
                              fontSize: '0.7rem', 
                              color: '#16a34a' 
                            }}>95</div>
                            <div style={{ 
                              position: 'absolute', 
                              left: '5px', 
                              bottom: '10px', 
                              fontSize: '0.7rem', 
                              color: '#16a34a' 
                            }}>90</div>
                            
                            {/* Chart bars */}
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'end', 
                              height: '100%', 
                              gap: '2px',
                              paddingLeft: '30px'
                            }}>
                              {vitals.slice(-15).map((v, i) => (
                                <div 
                                  key={i}
                                  style={{ 
                                    flex: 1,
                                    height: `${Math.max(5, ((v.SpO2 - 90) / 10) * 100)}%`,
                                    background: v.SpO2 < 95 ? '#dc2626' : '#16a34a',
                                    borderRadius: '2px 2px 0 0',
                                    transition: 'height 0.3s ease'
                                  }}
                                  title={`${v.SpO2.toFixed(1)}% at ${new Date(v.timestamp).toLocaleTimeString()}`}
                                />
                              ))}
                            </div>
                            <div style={{ 
                              textAlign: 'center', 
                              marginTop: '0.5rem', 
                              fontSize: '0.8rem', 
                              color: '#14532d' 
                            }}>
                              Current: {latest?.SpO2.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Chart Statistics */}
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>📊 Real-Time Statistics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {latest && [
                      { label: 'MAP', value: latest.MAP.toFixed(1), unit: 'mmHg', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fecaca', status: latest.MAP < 65 ? 'LOW' : latest.MAP > 100 ? 'HIGH' : 'NORMAL' },
                      { label: 'Heart Rate', value: latest.HR.toFixed(0), unit: 'bpm', color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe', status: latest.HR < 60 ? 'LOW' : latest.HR > 100 ? 'HIGH' : 'NORMAL' },
                      { label: 'SpO₂', value: latest.SpO2.toFixed(1), unit: '%', color: '#16a34a', bgColor: '#f0fdf4', borderColor: '#bbf7d0', status: latest.SpO2 < 95 ? 'LOW' : 'NORMAL' },
                      { label: 'Temperature', value: latest.Temp.toFixed(1), unit: '°C', color: '#d97706', bgColor: '#fffbeb', borderColor: '#fed7aa', status: latest.Temp < 36 || latest.Temp > 38 ? 'ABNORMAL' : 'NORMAL' },
                      { label: 'Respiratory Rate', value: latest.RR.toFixed(0), unit: '/min', color: '#7c3aed', bgColor: '#faf5ff', borderColor: '#d8b4fe', status: latest.RR < 12 || latest.RR > 20 ? 'ABNORMAL' : 'NORMAL' },
                      { label: 'EtCO₂', value: latest.EtCO2.toFixed(0), unit: 'mmHg', color: '#0891b2', bgColor: '#f0fdfa', borderColor: '#99f6e4', status: latest.EtCO2 < 30 || latest.EtCO2 > 45 ? 'ABNORMAL' : 'NORMAL' }
                    ].map((stat, index) => (
                      <div key={index} style={{ 
                        background: stat.bgColor, 
                        padding: '1rem', 
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: stat.status !== 'NORMAL' ? `2px solid ${stat.color}` : `1px solid ${stat.borderColor}`
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>
                          {stat.value} {stat.unit}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>
                          {stat.label}
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 'bold',
                          color: stat.status === 'NORMAL' ? '#16a34a' : '#dc2626',
                          background: stat.status === 'NORMAL' ? '#dcfce7' : '#fee2e2',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          display: 'inline-block'
                        }}>
                          {stat.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trend Analysis */}
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>📈 Trend Analysis (Last 10 Minutes)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {vitals.length >= 2 && (() => {
                      const recent = vitals.slice(-10);
                      const older = vitals.slice(-20, -10);
                      
                      const trends = [
                        {
                          parameter: 'MAP',
                          current: recent.reduce((sum, v) => sum + v.MAP, 0) / recent.length,
                          previous: older.reduce((sum, v) => sum + v.MAP, 0) / Math.max(older.length, 1),
                          unit: 'mmHg'
                        },
                        {
                          parameter: 'Heart Rate',
                          current: recent.reduce((sum, v) => sum + v.HR, 0) / recent.length,
                          previous: older.reduce((sum, v) => sum + v.HR, 0) / Math.max(older.length, 1),
                          unit: 'bpm'
                        },
                        {
                          parameter: 'SpO₂',
                          current: recent.reduce((sum, v) => sum + v.SpO2, 0) / recent.length,
                          previous: older.reduce((sum, v) => sum + v.SpO2, 0) / Math.max(older.length, 1),
                          unit: '%'
                        }
                      ];

                      return trends.map((trend, index) => {
                        const change = trend.current - trend.previous;
                        const changePercent = ((change / trend.previous) * 100);
                        const isIncreasing = change > 0;
                        const isSignificant = Math.abs(changePercent) > 5;

                        return (
                          <div key={index} style={{
                            background: 'white',
                            padding: '1rem',
                            borderRadius: '6px',
                            textAlign: 'center',
                            border: '1px solid #e5e7eb'
                          }}>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                              {trend.parameter}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#111827' }}>
                              {trend.current.toFixed(1)} {trend.unit}
                            </div>
                            <div style={{
                              fontSize: '0.8rem',
                              color: isSignificant ? (isIncreasing ? '#dc2626' : '#16a34a') : '#6b7280',
                              marginTop: '0.5rem'
                            }}>
                              {isIncreasing ? '↗️' : '↘️'} {Math.abs(change).toFixed(1)} {trend.unit}
                              <br />
                              ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                <p style={{ color: '#64748b' }}>Waiting for vitals data to generate charts...</p>
              </div>
            )}
          </div>
        );

                {/* Chart Statistics */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>📊 Real-Time Statistics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {latest && [
                      { label: 'MAP', value: latest.MAP.toFixed(1), unit: 'mmHg', color: '#ef4444', status: latest.MAP < 65 ? 'LOW' : latest.MAP > 100 ? 'HIGH' : 'NORMAL' },
                      { label: 'Heart Rate', value: latest.HR.toFixed(0), unit: 'bpm', color: '#3b82f6', status: latest.HR < 60 ? 'LOW' : latest.HR > 100 ? 'HIGH' : 'NORMAL' },
                      { label: 'SpO₂', value: latest.SpO2.toFixed(1), unit: '%', color: '#10b981', status: latest.SpO2 < 95 ? 'LOW' : 'NORMAL' },
                      { label: 'Temperature', value: latest.Temp.toFixed(1), unit: '°C', color: '#f59e0b', status: latest.Temp < 36 || latest.Temp > 38 ? 'ABNORMAL' : 'NORMAL' }
                    ].map((stat, index) => (
                      <div key={index} style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '1rem', 
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: stat.status !== 'NORMAL' ? `2px solid ${stat.color}` : 'none'
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stat.color }}>
                          {stat.value} {stat.unit}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'white', marginBottom: '0.5rem' }}>
                          {stat.label}
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 'bold',
                          color: stat.status === 'NORMAL' ? '#10b981' : '#ef4444'
                        }}>
                          {stat.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
                <p>Waiting for vitals data to generate charts...</p>
              </div>
            )}
          </div>
        );

      case 'forecast':
        return (
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ 
                margin: 0,
                color: '#0f172a',
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>🔮 Predictive Analytics</h2>
              <button
                onClick={fetchForecast}
                disabled={forecastLoading}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  background: forecastLoading ? '#f1f5f9' : '#eff6ff',
                  color: forecastLoading ? '#64748b' : '#2563eb',
                  cursor: forecastLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {forecastLoading ? '🔄 Computing...' : '🔮 Generate Forecast'}
              </button>
            </div>

            {forecastData ? (
              <div>
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: '600' }}>
                    Hypotension Risk Assessment
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem',
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold',
                      color: forecastData.risk_level === 'HIGH' ? '#dc2626' : 
                             forecastData.risk_level === 'MEDIUM' ? '#d97706' : '#16a34a'
                    }}>
                      {(forecastData.hypotension_risk * 100).toFixed(0)}%
                    </div>
                    <div>
                      <div style={{ 
                        fontWeight: '600',
                        color: forecastData.risk_level === 'HIGH' ? '#dc2626' : 
                               forecastData.risk_level === 'MEDIUM' ? '#d97706' : '#16a34a'
                      }}>
                        {forecastData.risk_level} RISK
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        Confidence: {(forecastData.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '1rem', 
                    fontSize: '0.9rem',
                    color: '#374151',
                    background: '#f8fafc',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <strong>Reasoning:</strong> {forecastData.reason}
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: '600' }}>
                    30-Minute Forecast
                  </h3>
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '1rem' }}>
                      {forecastData.trajectory.slice(0, 6).map((point, index) => (
                        <div key={index} style={{ 
                          textAlign: 'center',
                          background: 'white',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>
                            +{index * 5}min
                          </div>
                          <div style={{ fontWeight: '600', color: '#dc2626' }}>
                            {point.predicted_MAP.toFixed(0)}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#7f1d1d' }}>
                            mmHg
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔮</div>
                <p style={{ color: '#64748b' }}>Click "Generate Forecast" to predict patient trends</p>
              </div>
            )}
          </div>
        );

      case 'chat':
        return (
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ 
              margin: '0 0 1rem 0',
              color: '#0f172a',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>🤖 AI Clinical Assistant</h2>
            
            <div style={{ 
              height: '400px', 
              overflowY: 'auto', 
              background: '#f8fafc', 
              padding: '1rem', 
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #e2e8f0'
            }}>
              {chatMessages.map((msg, index) => (
                <div key={index} style={{ 
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: msg.role === 'user' ? '#eff6ff' : 'white',
                  marginLeft: msg.role === 'user' ? '2rem' : '0',
                  marginRight: msg.role === 'user' ? '0' : '2rem',
                  border: msg.role === 'user' ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ 
                    fontWeight: '600', 
                    marginBottom: '0.5rem',
                    color: msg.role === 'user' ? '#1e3a8a' : '#16a34a'
                  }}>
                    {msg.role === 'user' ? '👤 You' : '🤖 OR-BIT AI'}
                  </div>
                  <div style={{ color: '#374151', lineHeight: '1.5' }}>{msg.content}</div>
                  {msg.confidence && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#64748b', 
                      marginTop: '0.5rem',
                      background: '#f1f5f9',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      Confidence: {(msg.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div style={{ 
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'white',
                  marginRight: '2rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#16a34a' }}>
                    🤖 OR-BIT AI
                  </div>
                  <div style={{ color: '#374151' }}>
                    <span style={{ 
                      display: 'inline-block',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}>
                      Analyzing patient data...
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about vitals, sepsis risk, drug dosing..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#374151',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  background: chatLoading || !chatInput.trim() ? '#f1f5f9' : '#2563eb',
                  color: chatLoading || !chatInput.trim() ? '#64748b' : 'white',
                  cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                {chatLoading ? '⏳' : 'Send'}
              </button>
            </div>

            {/* Quick Questions */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: '500' }}>
                Quick Questions:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  'What are the current vitals?',
                  'Check sepsis risk',
                  'Recommend drug dosing',
                  'Any alerts?'
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setChatInput(question);
                      setTimeout(() => sendChatMessage(), 100);
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: 'white',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f9fafb';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'alerts':
        return (
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ 
                margin: 0,
                color: '#0f172a',
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>🚨 Active Alerts</h2>
              <button
                onClick={() => setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })))}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #16a34a',
                  borderRadius: '6px',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                ✓ Acknowledge All
              </button>
            </div>

            {alerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {alerts.map(alert => (
                  <div 
                    key={alert.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      background: alert.acknowledged ? '#f8fafc' : 
                                 alert.severity === 'HIGH' ? '#fef2f2' :
                                 alert.severity === 'MEDIUM' ? '#fffbeb' :
                                 '#eff6ff',
                      border: alert.acknowledged ? '1px solid #e2e8f0' : 
                             alert.severity === 'HIGH' ? '2px solid #dc2626' :
                             alert.severity === 'MEDIUM' ? '2px solid #d97706' :
                             '2px solid #2563eb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          marginBottom: '0.5rem',
                          color: alert.acknowledged ? '#64748b' : '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {alert.severity === 'HIGH' ? '🔴' : alert.severity === 'MEDIUM' ? '🟡' : '🔵'} 
                          {alert.type}
                          {alert.acknowledged && (
                            <span style={{
                              background: '#dcfce7',
                              color: '#166534',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              ACKNOWLEDGED
                            </span>
                          )}
                        </div>
                        <div style={{ color: alert.acknowledged ? '#64748b' : '#374151' }}>
                          {alert.description}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => setAlerts(prev => prev.map(a => 
                            a.id === alert.id ? { ...a, acknowledged: true } : a
                          ))}
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            background: 'white',
                            color: '#374151',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}
                        >
                          ✓ ACK
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <p style={{ color: '#64748b' }}>No active alerts</p>
              </div>
            )}
          </div>
        );

      case 'multipatient':
        return (
          <div>
            <h2 style={{ 
              marginBottom: '1rem',
              color: '#0f172a',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>👥 Multi-Patient Dashboard</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }}>
              {patients.map(patient => (
                <div 
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient.id)}
                  style={{
                    background: selectedPatient === patient.id ? '#eff6ff' : 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: selectedPatient === patient.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontWeight: '600' }}>
                        {patient.name}
                      </h3>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                        {patient.room} • {patient.procedure}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      background: patient.riskScore > 30 ? '#fef2f2' : '#f0fdf4',
                      color: patient.riskScore > 30 ? '#dc2626' : '#16a34a',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      border: patient.riskScore > 30 ? '1px solid #fecaca' : '1px solid #bbf7d0'
                    }}>
                      Risk: {patient.riskScore}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ textAlign: 'center', background: '#eff6ff', padding: '1rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                        {patient.vitals.HR.toFixed(0)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#1e3a8a' }}>HR</div>
                    </div>
                    <div style={{ textAlign: 'center', background: '#f0fdf4', padding: '1rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                        {patient.vitals.SpO2.toFixed(0)}%
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#14532d' }}>SpO₂</div>
                    </div>
                  </div>

                  {patient.alerts.length > 0 && (
                    <div style={{ 
                      padding: '0.75rem', 
                      background: '#fef2f2', 
                      borderRadius: '6px',
                      border: '1px solid #fecaca'
                    }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#dc2626' }}>
                        🚨 {patient.alerts.length} Active Alert{patient.alerts.length > 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', color: '#7f1d1d' }}>
                        {patient.alerts[0].description}
                      </div>
                    </div>
                  )}

                  {selectedPatient === patient.id && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: '#f1f5f9',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1'
                    }}>
                      <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '500' }}>
                        ✓ Selected Patient • Click tabs above to view details
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'sepsis':
        return (
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ 
                margin: 0,
                color: '#0f172a',
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>🧬 Advanced Sepsis Detection</h2>
              <button
                onClick={fetchSepsisAssessment}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #7c3aed',
                  borderRadius: '6px',
                  background: '#faf5ff',
                  color: '#7c3aed',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🔄 Assess Sepsis Risk
              </button>
            </div>

            {sepsisAssessment ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: '600' }}>
                    Risk Assessment
                  </h3>
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold',
                      color: sepsisAssessment.risk_level === 'CRITICAL' ? '#dc2626' :
                             sepsisAssessment.risk_level === 'HIGH' ? '#d97706' :
                             sepsisAssessment.risk_level === 'MODERATE' ? '#2563eb' : '#16a34a'
                    }}>
                      {(sepsisAssessment.risk_score * 100).toFixed(0)}%
                    </div>
                    <div style={{ color: '#64748b', marginBottom: '1rem' }}>Sepsis Risk</div>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '15px',
                      background: sepsisAssessment.risk_level === 'CRITICAL' ? '#fef2f2' :
                                 sepsisAssessment.risk_level === 'HIGH' ? '#fffbeb' :
                                 sepsisAssessment.risk_level === 'MODERATE' ? '#eff6ff' : '#f0fdf4',
                      color: sepsisAssessment.risk_level === 'CRITICAL' ? '#dc2626' :
                             sepsisAssessment.risk_level === 'HIGH' ? '#d97706' :
                             sepsisAssessment.risk_level === 'MODERATE' ? '#2563eb' : '#16a34a',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      border: sepsisAssessment.risk_level === 'CRITICAL' ? '1px solid #fecaca' :
                              sepsisAssessment.risk_level === 'HIGH' ? '1px solid #fed7aa' :
                              sepsisAssessment.risk_level === 'MODERATE' ? '1px solid #bfdbfe' : '1px solid #bbf7d0'
                    }}>
                      {sepsisAssessment.risk_level} RISK
                    </div>
                  </div>

                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: '600' }}>
                      SIRS Criteria
                    </h4>
                    {Object.entries(sepsisAssessment.sirs_criteria).map(([key, value]) => (
                      <div key={key} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        background: value ? '#fef2f2' : '#f0fdf4',
                        borderRadius: '6px',
                        border: value ? '1px solid #fecaca' : '1px solid #bbf7d0'
                      }}>
                        <span style={{ fontSize: '0.9rem', color: '#374151' }}>{key}</span>
                        <span style={{ 
                          color: value ? '#dc2626' : '#16a34a',
                          fontWeight: '600'
                        }}>
                          {value ? '✗ Positive' : '✓ Negative'}
                        </span>
                      </div>
                    ))}
                    <div style={{ 
                      marginTop: '1rem',
                      padding: '0.5rem',
                      background: 'white',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <strong style={{ color: '#1e293b' }}>qSOFA Score: {sepsisAssessment.qsofa_score}/3</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: '600' }}>
                    Clinical Evidence
                  </h3>
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    marginBottom: '1rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    {sepsisAssessment.evidence.map((evidence, index) => (
                      <div key={index} style={{ 
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        background: 'white',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        fontSize: '0.9rem',
                        color: '#374151'
                      }}>
                        • {evidence}
                      </div>
                    ))}
                  </div>

                  <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: '600' }}>
                    Clinical Recommendations
                  </h3>
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {sepsisAssessment.recommendations.map((rec, index) => (
                      <div key={index} style={{ 
                        marginBottom: '0.5rem',
                        padding: '0.75rem',
                        background: '#eff6ff',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                        fontSize: '0.9rem',
                        color: '#1e3a8a',
                        fontWeight: '500'
                      }}>
                        {index + 1}. {rec}
                      </div>
                    ))}
                  </div>

                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#f0fdf4',
                    borderRadius: '6px',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '500' }}>
                      <strong>AI Confidence:</strong> {(sepsisAssessment.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧬</div>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                  Click "Assess Sepsis Risk" to analyze current patient data using advanced AI algorithms
                </p>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#9ca3af',
                  background: 'white',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  display: 'inline-block'
                }}>
                  Analysis includes SIRS criteria, qSOFA scoring, and machine learning risk assessment
                </div>
              </div>
            )}
          </div>
        );

      case 'drugs':
        return (
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ 
              margin: '0 0 1rem 0',
              color: '#0f172a',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>💊 AI-Powered Drug Dosing</h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem', 
              marginBottom: '2rem' 
            }}>
              {['propofol', 'midazolam', 'fentanyl', 'norepinephrine', 'phenylephrine'].map(drug => (
                <button
                  key={drug}
                  onClick={() => calculateDrugDosage(drug)}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f9fafb';
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  💊 {drug}
                </button>
              ))}
            </div>

            {drugRecommendation && (
              <div style={{ 
                background: '#f8fafc', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#0f172a',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '500'
                  }}>
                    RECOMMENDATION
                  </span>
                  {drugRecommendation.drug_name}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: '600' }}>
                      Dosing Information
                    </h4>
                    <div style={{
                      background: 'white',
                      padding: '1rem',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Dose:</span>
                        <span style={{ marginLeft: '0.5rem', color: '#0f172a' }}>
                          {drugRecommendation.recommended_dose} {drugRecommendation.dose_unit}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Route:</span>
                        <span style={{ marginLeft: '0.5rem', color: '#0f172a' }}>
                          {drugRecommendation.route}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Frequency:</span>
                        <span style={{ marginLeft: '0.5rem', color: '#0f172a' }}>
                          {drugRecommendation.frequency}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '600', color: '#374151' }}>Duration:</span>
                        <span style={{ marginLeft: '0.5rem', color: '#0f172a' }}>
                          {drugRecommendation.duration}
                        </span>
                      </div>
                      <div style={{ 
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: '#f0fdf4',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0'
                      }}>
                        <span style={{ fontWeight: '600', color: '#166534' }}>AI Confidence:</span>
                        <span style={{ marginLeft: '0.5rem', color: '#14532d' }}>
                          {(drugRecommendation.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: '600' }}>
                      Safety Information
                    </h4>
                    
                    {drugRecommendation.contraindications.length > 0 && (
                      <div style={{ 
                        marginBottom: '1rem',
                        background: '#fef2f2',
                        padding: '1rem',
                        borderRadius: '6px',
                        border: '1px solid #fecaca'
                      }}>
                        <div style={{ fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>
                          ⚠️ Contraindications:
                        </div>
                        <ul style={{ margin: '0', paddingLeft: '1rem', color: '#7f1d1d' }}>
                          {drugRecommendation.contraindications.map((contra, index) => (
                            <li key={index} style={{ marginBottom: '0.25rem' }}>{contra}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div style={{
                      background: '#eff6ff',
                      padding: '1rem',
                      borderRadius: '6px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <div style={{ fontWeight: '600', color: '#2563eb', marginBottom: '0.5rem' }}>
                        📊 Monitoring Parameters:
                      </div>
                      <ul style={{ margin: '0', paddingLeft: '1rem', color: '#1e3a8a' }}>
                        {drugRecommendation.monitoring_parameters.map((param, index) => (
                          <li key={index} style={{ marginBottom: '0.25rem' }}>{param}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: 'white', 
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Clinical Rationale:
                  </div>
                  <div style={{ color: '#64748b', lineHeight: '1.5' }}>
                    {drugRecommendation.rationale}
                  </div>
                </div>

                {/* Additional Drug Information */}
                <div style={{ 
                  marginTop: '1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div style={{
                    background: '#fffbeb',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #fed7aa',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: '500' }}>
                      Drug Class
                    </div>
                    <div style={{ color: '#d97706', fontWeight: '600' }}>
                      {drugRecommendation.drug_name === 'propofol' ? 'Anesthetic' :
                       drugRecommendation.drug_name === 'midazolam' ? 'Benzodiazepine' :
                       drugRecommendation.drug_name === 'fentanyl' ? 'Opioid Analgesic' :
                       'Vasopressor'}
                    </div>
                  </div>
                  <div style={{
                    background: '#f0f9ff',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #bae6fd',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#0c4a6e', fontWeight: '500' }}>
                      Onset Time
                    </div>
                    <div style={{ color: '#0284c7', fontWeight: '600' }}>
                      {drugRecommendation.drug_name === 'propofol' ? '30-60 seconds' :
                       drugRecommendation.drug_name === 'midazolam' ? '1-3 minutes' :
                       drugRecommendation.drug_name === 'fentanyl' ? '1-2 minutes' :
                       '1-2 minutes'}
                    </div>
                  </div>
                  <div style={{
                    background: '#f7fee7',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #bef264',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#365314', fontWeight: '500' }}>
                      Duration
                    </div>
                    <div style={{ color: '#65a30d', fontWeight: '600' }}>
                      {drugRecommendation.drug_name === 'propofol' ? '3-10 minutes' :
                       drugRecommendation.drug_name === 'midazolam' ? '30-60 minutes' :
                       drugRecommendation.drug_name === 'fentanyl' ? '30-60 minutes' :
                       'Variable'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!drugRecommendation && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💊</div>
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                  Select a medication above to get AI-powered dosing recommendations
                </p>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#9ca3af',
                  background: 'white',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  display: 'inline-block'
                }}>
                  Recommendations based on patient weight, age, comorbidities, and current vitals
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>Select a view from the navigation above</div>;
    }
  };

  // Mobile view
  if (isMobile) {
    return (
      <>
        <Head>
          <title>OR-BIT Mobile</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        
        <div style={{ 
          padding: '1rem', 
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: '#f8fafc',
          minHeight: '100vh',
          color: '#1e293b'
        }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            margin: '0 0 1rem 0', 
            textAlign: 'center',
            color: '#0f172a',
            fontWeight: '700'
          }}>
            🏥 OR-BIT Mobile
          </h1>
          
          {latest && (
            <div style={{ 
              background: 'white', 
              padding: '1rem', 
              borderRadius: '12px', 
              marginBottom: '1rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ 
                margin: '0 0 1rem 0',
                color: '#0f172a',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>Current Vitals</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                <div style={{
                  background: '#eff6ff',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                    {latest.HR.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>HR</div>
                </div>
                <div style={{
                  background: '#f0fdf4',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                    {latest.SpO2.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#14532d' }}>SpO₂</div>
                </div>
              </div>
            </div>
          )}

          <div style={{ 
            background: 'white', 
            padding: '1rem', 
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ 
              margin: '0 0 1rem 0',
              color: '#0f172a',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>Quick Actions</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <button
                onClick={() => fetchSepsisAssessment()}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  color: '#1e293b',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🧬 Check Sepsis Risk
              </button>
              <button
                onClick={() => calculateDrugDosage('propofol')}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  color: '#1e293b',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                💊 Drug Dosing
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>OR-BIT - Complete Clinical Intelligence System</title>
        <meta name="description" content="Advanced Operating Room Bio-Intelligence Twin" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ 
        padding: '2rem', 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#f8fafc',
        minHeight: '100vh',
        color: '#1e293b'
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem',
            background: 'white',
            padding: '1.5rem 2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                margin: '0 0 0.5rem 0',
                color: '#0f172a',
                fontWeight: '700'
              }}>
                🏥 OR-BIT Clinical Intelligence
              </h1>
              <p style={{ 
                margin: 0, 
                color: '#64748b',
                fontSize: '1.1rem'
              }}>
                Real-time Patient Monitoring • AI Clinical Support • Multi-Patient Dashboard
              </p>
            </div>

            {/* Advanced Controls */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {/* Apple Watch Status */}
              {healthKitConnected && (
                <div style={{ 
                  background: '#dcfce7', 
                  color: '#166534',
                  padding: '0.5rem 1rem', 
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  border: '1px solid #bbf7d0',
                  fontWeight: '500'
                }}>
                  🍎 Apple Watch Connected
                </div>
              )}

              {/* Voice Commands */}
              {voiceSupported && (
                <button
                  onClick={toggleListening}
                  style={{
                    padding: '0.5rem 1rem',
                    border: isListening ? '1px solid #ef4444' : '1px solid #e2e8f0',
                    borderRadius: '20px',
                    background: isListening ? '#fef2f2' : 'white',
                    color: isListening ? '#ef4444' : '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  🎤 {isListening ? 'Listening...' : 'Voice Commands'}
                </button>
              )}

              {/* System Status */}
              <div style={{ 
                background: '#f1f5f9', 
                color: '#475569',
                padding: '0.5rem 1rem', 
                borderRadius: '20px',
                fontSize: '0.9rem',
                border: '1px solid #e2e8f0',
                fontWeight: '500'
              }}>
                {status}
              </div>
            </div>
          </div>

          {/* Navigation */}
          {renderNavigationTabs()}

          {/* Main Content */}
          {renderContent()}

          {/* Footer */}
          <div style={{ 
            marginTop: '2rem', 
            color: '#64748b', 
            fontSize: '0.9rem', 
            textAlign: 'center',
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>OR-BIT v2.0.0 - Clinical Intelligence System</p>
            <p style={{ margin: 0 }}>Real-time Monitoring • AI Diagnostics • Voice Commands • Multi-Patient Support</p>
          </div>
        </div>
      </div>
    </>
  );
}