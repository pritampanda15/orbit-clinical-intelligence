// src/components/PatientSummary.tsx - Patient Status Overview
import React, { useState, useEffect } from 'react';

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

interface PatientEvent {
  timestamp: string;
  type: string;
  description: string;
  severity: string;
  source: string;
}

interface PatientSummaryData {
  patient_id: string;
  status: string;
  latest_vitals: {
    MAP: number;
    HR: number;
    SpO2: number;
    trends: {
      MAP: string;
    };
  };
  active_alerts: number;
  session_duration: string;
}

interface PatientSummaryProps {
  vitals: VitalsData | null;
  status: string;
  events: PatientEvent[];
}

export default function PatientSummary({ vitals, status, events }: PatientSummaryProps) {
  const [summaryData, setSummaryData] = useState<PatientSummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch comprehensive patient summary
  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/patient-summary');
        if (response.ok) {
          const data = await response.json();
          setSummaryData(data);
        }
      } catch (error) {
        console.error('Failed to fetch patient summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'stable': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      case 'unstable': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'stable': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      case 'unstable': return '🚨';
      default: return '❓';
    }
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend.toLowerCase()) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend.toLowerCase()) {
      case 'increasing': return 'text-green-600';
      case 'decreasing': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getVitalStatus = (vital: string, value: number): 'normal' | 'warning' | 'critical' => {
    switch (vital) {
      case 'MAP':
        if (value < 60) return 'critical';
        if (value < 65) return 'warning';
        return 'normal';
      case 'HR':
        if (value < 50 || value > 120) return 'critical';
        if (value < 60 || value > 100) return 'warning';
        return 'normal';
      case 'SpO2':
        if (value < 90) return 'critical';
        if (value < 95) return 'warning';
        return 'normal';
      default:
        return 'normal';
    }
  };

  const getVitalStatusColor = (vitalStatus: 'normal' | 'warning' | 'critical'): string => {
    switch (vitalStatus) {
      case 'normal': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
    }
  };

  const criticalEvents = events.filter(e => e.severity === 'HIGH').length;
  const warningEvents = events.filter(e => e.severity === 'MEDIUM').length;

  if (loading && !summaryData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Patient Summary</h3>
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
              <span className="mr-1">{getStatusIcon(status)}</span>
              {status.toUpperCase()}
            </div>
          </div>
        </div>
        
        {summaryData && (
          <div className="mt-2 text-sm text-gray-500">
            Patient ID: {summaryData.patient_id} • Session: {summaryData.session_duration}
          </div>
        )}
      </div>

      {/* Current Vitals */}
      <div className="p-4 space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Current Vitals</h4>
          {vitals ? (
            <div className="grid grid-cols-1 gap-3">
              {/* MAP */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700">MAP</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${getVitalStatusColor(getVitalStatus('MAP', vitals.MAP))}`}>
                      {vitals.MAP.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">mmHg</span>
                    {summaryData?.latest_vitals.trends.MAP && (
                      <span className={`${getTrendColor(summaryData.latest_vitals.trends.MAP)}`}>
                        {getTrendIcon(summaryData.latest_vitals.trends.MAP)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Target: 65-100
                </div>
              </div>

              {/* Heart Rate */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700">Heart Rate</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${getVitalStatusColor(getVitalStatus('HR', vitals.HR))}`}>
                      {vitals.HR.toFixed(0)}
                    </span>
                    <span className="text-sm text-gray-500">bpm</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Target: 60-100
                </div>
              </div>

              {/* SpO2 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700">SpO₂</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${getVitalStatusColor(getVitalStatus('SpO2', vitals.SpO2))}`}>
                      {vitals.SpO2.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Target: >95
                </div>
              </div>

              {/* Additional Vitals Row */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-700">RR</div>
                  <div className="text-sm font-bold">{vitals.RR.toFixed(0)} /min</div>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-700">Temp</div>
                  <div className="text-sm font-bold">{vitals.Temp.toFixed(1)}°C</div>
                </div>
              </div>

              {vitals.BIS && (
                <div className="p-2 bg-blue-50 rounded-lg">
                  <div className="text-xs font-medium text-blue-700">BIS</div>
                  <div className="text-sm font-bold text-blue-800">{vitals.BIS.toFixed(1)}</div>
                  <div className="text-xs text-blue-600">Anesthetic depth</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <div className="text-2xl mb-2">📊</div>
              <div>No vitals data available</div>
            </div>
          )}
        </div>

        {/* Alert Summary */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Alert Summary</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-700">Critical</span>
                <span className="text-lg font-bold text-red-800">{criticalEvents}</span>
              </div>
              <div className="text-xs text-red-600">High priority alerts</div>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-yellow-700">Warning</span>
                <span className="text-lg font-bold text-yellow-800">{warningEvents}</span>
              </div>
              <div className="text-xs text-yellow-600">Medium priority</div>
            </div>
          </div>
        </div>

        {/* Recent Events Preview */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Recent Events</h4>
          {events.length > 0 ? (
            <div className="space-y-2">
              {events.slice(0, 3).map((event, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg text-sm ${
                    event.severity === 'HIGH' 
                      ? 'bg-red-50 border border-red-200' 
                      : event.severity === 'MEDIUM'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{event.type}</div>
                      <div className="text-xs text-gray-600 truncate">{event.description}</div>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      {event.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              
              {events.length > 3 && (
                <div className="text-center text-xs text-gray-500 pt-2">
                  +{events.length - 3} more events
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-3">
              <div className="text-xl mb-1">🟢</div>
              <div className="text-sm">No recent events</div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              📋 View Full Report
            </button>
            <button className="p-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
              📊 Trending Data
            </button>
            <button className="p-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              🔔 Alert Settings
            </button>
            <button className="p-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              📁 Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-xl">
        <div className="text-xs text-gray-500 text-center">
          Last updated: {vitals ? new Date(vitals.timestamp).toLocaleTimeString() : 'Never'}
        </div>
      </div>
    </div>
  );
}