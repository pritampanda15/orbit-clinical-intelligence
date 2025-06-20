import React, { useState } from 'react';

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  acknowledged: boolean;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onAcknowledgeAll: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ 
  alerts, 
  onAcknowledge, 
  onAcknowledgeAll 
}) => {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([]);

  const handleAcknowledge = (alertId: string) => {
    setAcknowledgedAlerts(prev => [...prev, alertId]);
    onAcknowledge(alertId);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Alerts Panel</h3>
      {alerts.length === 0 ? (
        <p>No active alerts</p>
      ) : (
        <div>
          <button onClick={onAcknowledgeAll}>Acknowledge All</button>
          {alerts.map(alert => (
            <div key={alert.id} style={{ margin: '0.5rem 0', padding: '0.5rem', border: '1px solid #ccc' }}>
              <div>{alert.message}</div>
              <button onClick={() => handleAcknowledge(alert.id)}>
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;
