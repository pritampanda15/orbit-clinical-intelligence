// src/components/AlertsPanel.tsx - Real-time Clinical Alerts
import React, { useState, useEffect, useMemo } from 'react';

interface PatientEvent {
  timestamp: string;
  type: string;
  description: string;
  severity: string;
  source: string;
}

interface AlertsPanelProps {
  events: PatientEvent[];
}

interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  threshold: number;
  condition: 'above' | 'below' | 'equal';
  vital: string;
}

export default function AlertsPanel({ events }: AlertsPanelProps) {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    { id: '1', name: 'Hypotension', enabled: true, threshold: 65, condition: 'below', vital: 'MAP' },
    { id: '2', name: 'Severe Hypotension', enabled: true, threshold: 55, condition: 'below', vital: 'MAP' },
    { id: '3', name: 'Tachycardia', enabled: true, threshold: 100, condition: 'above', vital: 'HR' },
    { id: '4', name: 'Severe Tachycardia', enabled: true, threshold: 120, condition: 'above', vital: 'HR' },
    { id: '5', name: 'Hypoxemia', enabled: true, threshold: 95, condition: 'below', vital: 'SpO2' },
    { id: '6', name: 'Severe Hypoxemia', enabled: true, threshold: 90, condition: 'below', vital: 'SpO2' },
  ]);

  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [alertSound, setAlertSound] = useState(true);

  // Process and categorize alerts
  const processedAlerts = useMemo(() => {
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    
    const recentEvents = events.filter(event => {
      const eventTime = new Date(event.timestamp);
      return now.getTime() - eventTime.getTime() < oneHour;
    });

    const activeAlerts = recentEvents.filter(event => 
      event.severity === 'HIGH' && !acknowledgedAlerts.has(getEventId(event))
    );

    const warningAlerts = recentEvents.filter(event => 
      event.severity === 'MEDIUM' && !acknowledgedAlerts.has(getEventId(event))
    );

    return {
      active: activeAlerts,
      warnings: warningAlerts,
      all: recentEvents
    };
  }, [events, acknowledgedAlerts]);

  const getEventId = (event: PatientEvent): string => {
    return `${event.timestamp}-${event.type}-${event.description}`;
  };

  const acknowledgeAlert = (event: PatientEvent) => {
    const eventId = getEventId(event);
    setAcknowledgedAlerts(prev => new Set([...prev, eventId]));
  };

  const acknowledgeAllAlerts = () => {
    const allActiveIds = [...processedAlerts.active, ...processedAlerts.warnings]
      .map(event => getEventId(event));
    setAcknowledgedAlerts(prev => new Set([...prev, ...allActiveIds]));
  };

  const getAlertIcon = (type: string, severity: string): string => {
    if (severity === 'HIGH') {
      switch (type) {
        case 'HYPOTENSION': return '🩸';
        case 'TACHYCARDIA': return '💓';
        case 'HYPOXEMIA': return '🫁';
        default: return '🚨';
      }
    }
    return '⚠️';
  };

  const getAlertColor = (severity: string): string => {
    switch (severity) {
      case 'HIGH': return 'border-red-500 bg-red-50';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getTimeSinceAlert = (timestamp: string): string => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  const toggleAlertRule = (ruleId: string) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const updateAlertRule = (ruleId: string, updates: Partial<AlertRule>) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  // Play alert sound for new critical alerts
  useEffect(() => {
    if (alertSound && processedAlerts.active.length > 0) {
      // In a real implementation, you would play an audio file here
      console.log('🔊 Critical alert sound would play');
    }
  }, [processedAlerts.active.length, alertSound]);

  const renderAlertItem = (event: PatientEvent, showAck: boolean = true) => {
    return (
      <div
        key={getEventId(event)}
        className={`border-l-4 p-3 rounded-r-lg ${getAlertColor(event.severity)} animate-pulse`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 flex-1">
            <span className="text-lg">
              {getAlertIcon(event.type, event.severity)}
            </span>
            <div className="flex-1">
              <div className="font-medium text-sm">
                {event.type.replace('_', ' ')}
              </div>
              <div className="text-sm text-gray-700 mt-1">
                {event.description}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getTimeSinceAlert(event.timestamp)} • {event.source}
              </div>
            </div>
          </div>
          
          {showAck && (
            <button
              onClick={() => acknowledgeAlert(event)}
              className="ml-2 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
              title="Acknowledge Alert"
            >
              ✓
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAlertSettings = () => {
    if (!showSettings) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Alert Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Global Settings */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={alertSound}
                onChange={(e) => setAlertSound(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Enable alert sounds</span>
            </label>
          </div>

          {/* Alert Rules */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Alert Rules</h4>
            {alertRules.map(rule => (
              <div key={rule.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{rule.name}</span>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleAlertRule(rule.id)}
                      className="rounded"
                    />
                  </label>
                </div>
                
                {rule.enabled && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-gray-600">Vital</label>
                      <input
                        type="text"
                        value={rule.vital}
                        onChange={(e) => updateAlertRule(rule.id, { vital: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600">Condition</label>
                      <select
                        value={rule.condition}
                        onChange={(e) => updateAlertRule(rule.id, { condition: e.target.value as any })}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="above">Above</option>
                        <option value="below">Below</option>
                        <option value="equal">Equal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600">Threshold</label>
                      <input
                        type="number"
                        value={rule.threshold}
                        onChange={(e) => updateAlertRule(rule.id, { threshold: Number(e.target.value) })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Clinical Alerts</h3>
              <p className="text-sm text-gray-500">Real-time monitoring and notifications</p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSettings(true)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                title="Alert Settings"
              >
                ⚙️
              </button>
              
              {(processedAlerts.active.length > 0 || processedAlerts.warnings.length > 0) && (
                <button
                  onClick={acknowledgeAllAlerts}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                  title="Acknowledge All"
                >
                  ✓ All
                </button>
              )}
            </div>
          </div>

          {/* Alert Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-red-600">
                {processedAlerts.active.length}
              </div>
              <div className="text-xs text-red-700">Critical</div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-yellow-600">
                {processedAlerts.warnings.length}
              </div>
              <div className="text-xs text-yellow-700">Warnings</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <div className="text-lg font-bold text-gray-600">
                {processedAlerts.all.length}
              </div>
              <div className="text-xs text-gray-700">Total (1h)</div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Active Critical Alerts */}
          {processedAlerts.active.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-red-700 mb-3 flex items-center">
                🚨 Critical Alerts ({processedAlerts.active.length})
              </h4>
              <div className="space-y-2">
                {processedAlerts.active.map(alert => renderAlertItem(alert))}
              </div>
            </div>
          )}

          {/* Warning Alerts */}
          {processedAlerts.warnings.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-yellow-700 mb-3 flex items-center">
                ⚠️ Warnings ({processedAlerts.warnings.length})
              </h4>
              <div className="space-y-2">
                {processedAlerts.warnings.map(alert => renderAlertItem(alert))}
              </div>
            </div>
          )}

          {/* No Active Alerts */}
          {processedAlerts.active.length === 0 && processedAlerts.warnings.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">✅</div>
              <div className="text-lg font-medium">All Clear</div>
              <div className="text-sm">No active alerts at this time</div>
              
              {processedAlerts.all.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Recent resolved alerts:
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {processedAlerts.all.slice(0, 3).map(alert => (
                      <div key={getEventId(alert)} className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                        {alert.type} - {getTimeSinceAlert(alert.timestamp)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div>
              Last check: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${alertSound ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span>Sound: {alertSound ? 'On' : 'Off'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Settings Modal */}
      {renderAlertSettings()}
    </>
  );
}