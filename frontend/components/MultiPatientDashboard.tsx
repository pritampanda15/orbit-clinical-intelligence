// src/components/MultiPatientDashboard.tsx - Multi-Patient Monitoring
import React, { useState, useEffect } from 'react';

export interface Patient {
  id: string;
  name: string;
  room: string;
  age: number;
  gender: 'M' | 'F';
  procedure: string;
  admissionTime: Date;
  vitals: {
    MAP: number;
    HR: number;
    SpO2: number;
    RR: number;
    Temp: number;
    EtCO2: number;
    BIS?: number;
    timestamp: Date;
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    timestamp: Date;
    acknowledged: boolean;
  }>;
  riskScore: number;
  status: 'STABLE' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  assignedStaff: {
    surgeon: string;
    anesthesiologist: string;
    nurse: string;
  };
}

interface MultiPatientDashboardProps {
  onSelectPatient: (patient: Patient) => void;
}

export const MultiPatientDashboard: React.FC<MultiPatientDashboardProps> = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sortBy, setSortBy] = useState<'room' | 'status' | 'risk' | 'time'>('risk');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with sample patients
    const samplePatients: Patient[] = [
      {
        id: 'PAT-001',
        name: 'John Smith',
        room: 'OR-1',
        age: 65,
        gender: 'M',
        procedure: 'Coronary Artery Bypass',
        admissionTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        vitals: generateVitals(),
        alerts: [],
        riskScore: 0.3,
        status: 'STABLE',
        assignedStaff: {
          surgeon: 'Dr. Wilson',
          anesthesiologist: 'Dr. Chen',
          nurse: 'RN Davis'
        }
      },
      {
        id: 'PAT-002',
        name: 'Maria Garcia',
        room: 'OR-2',
        age: 45,
        gender: 'F',
        procedure: 'Laparoscopic Cholecystectomy',
        admissionTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        vitals: generateVitals(true), // Generate concerning vitals
        alerts: [
          {
            id: 'ALT-001',
            type: 'HYPOTENSION',
            severity: 'HIGH',
            description: 'MAP dropped to 58 mmHg',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            acknowledged: false
          }
        ],
        riskScore: 0.75,
        status: 'CRITICAL',
        assignedStaff: {
          surgeon: 'Dr. Johnson',
          anesthesiologist: 'Dr. Lee',
          nurse: 'RN Thompson'
        }
      },
      {
        id: 'PAT-003',
        name: 'Robert Johnson',
        room: 'OR-3',
        age: 58,
        gender: 'M',
        procedure: 'Total Knee Replacement',
        admissionTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        vitals: generateVitals(),
        alerts: [
          {
            id: 'ALT-002',
            type: 'TACHYCARDIA',
            severity: 'MEDIUM',
            description: 'HR elevated to 105 bpm',
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            acknowledged: true
          }
        ],
        riskScore: 0.4,
        status: 'WARNING',
        assignedStaff: {
          surgeon: 'Dr. Brown',
          anesthesiologist: 'Dr. Kim',
          nurse: 'RN Martinez'
        }
      },
      {
        id: 'PAT-004',
        name: 'Sarah Wilson',
        room: 'OR-4',
        age: 72,
        gender: 'F',
        procedure: 'Hip Fracture Repair',
        admissionTime: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        vitals: generateVitals(),
        alerts: [],
        riskScore: 0.2,
        status: 'STABLE',
        assignedStaff: {
          surgeon: 'Dr. Taylor',
          anesthesiologist: 'Dr. Anderson',
          nurse: 'RN White'
        }
      }
    ];

    setPatients(samplePatients);

    // Set up real-time updates
    const updateInterval = setInterval(() => {
      setPatients(prev => prev.map(patient => ({
        ...patient,
        vitals: generateVitals(patient.status === 'CRITICAL'),
        riskScore: calculateRiskScore(patient)
      })));
    }, 5000);

    return () => clearInterval(updateInterval);
  }, []);

  function generateVitals(concerning = false) {
    const base = concerning ? 
      { MAP: 60, HR: 95, SpO2: 94, RR: 18, Temp: 37.2 } :
      { MAP: 75, HR: 80, SpO2: 98, RR: 16, Temp: 36.5 };

    return {
      MAP: Math.max(45, base.MAP + (Math.random() - 0.5) * 20),
      HR: Math.max(50, base.HR + (Math.random() - 0.5) * 30),
      SpO2: Math.min(100, Math.max(85, base.SpO2 + (Math.random() - 0.5) * 6)),
      RR: Math.max(8, base.RR + (Math.random() - 0.5) * 8),
      Temp: Math.max(35, base.Temp + (Math.random() - 0.5) * 2),
      EtCO2: 35 + (Math.random() - 0.5) * 10,
      BIS: 40 + Math.random() * 20,
      timestamp: new Date()
    };
  }

  function calculateRiskScore(patient: Patient): number {
    let score = 0;
    const v = patient.vitals;

    // MAP risk
    if (v.MAP < 65) score += 0.3;
    if (v.MAP < 55) score += 0.2;

    // HR risk
    if (v.HR > 100) score += 0.2;
    if (v.HR > 120) score += 0.2;

    // SpO2 risk
    if (v.SpO2 < 95) score += 0.3;
    if (v.SpO2 < 90) score += 0.3;

    // Active alerts
    score += patient.alerts.filter(a => !a.acknowledged).length * 0.1;

    return Math.min(1, score);
  }

  const sortedAndFilteredPatients = patients
    .filter(patient => {
      if (filterStatus === 'ALL') return true;
      return patient.status === filterStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'room':
          return a.room.localeCompare(b.room);
        case 'status':
          const statusOrder = { 'EMERGENCY': 0, 'CRITICAL': 1, 'WARNING': 2, 'STABLE': 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'risk':
          return b.riskScore - a.riskScore;
        case 'time':
          return a.admissionTime.getTime() - b.admissionTime.getTime();
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EMERGENCY': return 'bg-red-600 text-white';
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'WARNING': return 'bg-yellow-500 text-black';
      case 'STABLE': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk > 0.7) return 'text-red-600';
    if (risk > 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getVitalStatus = (vital: string, value: number) => {
    switch (vital) {
      case 'MAP':
        if (value < 60) return 'critical';
        if (value < 65) return 'warning';
        return 'normal';
      case 'HR':
        if (value > 120 || value < 50) return 'critical';
        if (value > 100 || value < 60) return 'warning';
        return 'normal';
      case 'SpO2':
        if (value < 90) return 'critical';
        if (value < 95) return 'warning';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const getVitalStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 font-bold';
      case 'warning': return 'text-yellow-600 font-bold';
      case 'normal': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏥 Multi-Patient Operating Room Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time monitoring of {patients.length} active patients
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="risk">Risk Score</option>
              <option value="status">Status</option>
              <option value="room">Room</option>
              <option value="time">Admission Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Patients</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="WARNING">Warning Only</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {patients.filter(p => p.status === 'CRITICAL').length}
            </div>
            <div className="text-xs text-gray-600">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {patients.filter(p => p.status === 'WARNING').length}
            </div>
            <div className="text-xs text-gray-600">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {patients.filter(p => p.status === 'STABLE').length}
            </div>
            <div className="text-xs text-gray-600">Stable</div>
          </div>
        </div>
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedAndFilteredPatients.map(patient => (
          <div
            key={patient.id}
            className={`bg-white rounded-xl shadow-lg border-2 transition-all cursor-pointer hover:shadow-xl ${
              selectedPatient === patient.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            }`}
            onClick={() => {
              setSelectedPatient(patient.id);
              onSelectPatient(patient);
            }}
          >
            {/* Patient Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600">
                    {patient.age}yr {patient.gender} • Room {patient.room}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                {patient.procedure}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Started: {patient.admissionTime.toLocaleTimeString()}
                </span>
                <span className={`text-sm font-bold ${getRiskColor(patient.riskScore)}`}>
                  Risk: {(patient.riskScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Vitals */}
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Current Vitals</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(patient.vitals).map(([key, value]) => {
                  if (key === 'timestamp' || key === 'BIS' || typeof value !== 'number') return null;
                  const status = getVitalStatus(key, value);
                  return (
                    <div key={key} className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-600">{key}</div>
                      <div className={`font-bold ${getVitalStatusColor(status)}`}>
                        {value.toFixed(key === 'HR' || key === 'RR' ? 0 : 1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerts */}
            {patient.alerts.length > 0 && (
              <div className="p-4 pt-0">
                <h4 className="font-medium text-gray-900 mb-2">Active Alerts</h4>
                {patient.alerts.slice(0, 2).map(alert => (
                  <div
                    key={alert.id}
                    className={`text-xs p-2 rounded mb-1 ${
                      alert.acknowledged ? 'bg-gray-100 text-gray-600' : 
                      alert.severity === 'HIGH' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    <div className="font-medium">{alert.type}</div>
                    <div>{alert.description}</div>
                  </div>
                ))}
                {patient.alerts.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{patient.alerts.length - 2} more alerts
                  </div>
                )}
              </div>
            )}

            {/* Staff */}
            <div className="p-4 pt-0 border-t border-gray-100">
              <div className="text-xs text-gray-600">
                <div>👨‍⚕️ {patient.assignedStaff.surgeon}</div>
                <div>💉 {patient.assignedStaff.anesthesiologist}</div>
                <div>👩‍⚕️ {patient.assignedStaff.nurse}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex justify-center space-x-4">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          📊 Generate Summary Report
        </button>
        <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          📞 Contact All Teams
        </button>
        <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          🚨 Emergency Protocol
        </button>
      </div>
    </div>
  );
};