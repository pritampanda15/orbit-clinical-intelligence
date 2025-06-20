// src/components/RiskForecast.tsx - Risk Prediction and Clinical Forecasting
import React, { useState, useEffect, useMemo } from 'react';
import {
  Line,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
} from 'chart.js';
import { Line as LineChart } from 'react-chartjs-2';

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

interface ForecastData {
  trajectory: Array<{
    timestamp: string;
    predicted_MAP: number;
    predicted_HR: number;
    predicted_SpO2: number;
  }>;
  hypotension_risk: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  explanations: Array<{
    feature: string;
    value: number;
    importance: number;
  }>;
  confidence: number;
}

interface RiskForecastProps {
  expanded?: boolean;
}

export default function RiskForecast({ expanded = false }: RiskForecastProps) {
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'MAP' | 'HR' | 'SpO2'>('MAP');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch forecast data
  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration_minutes: 30,
          vitals_type: selectedMetric
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setForecastData(data);
    } catch (err) {
      console.error('Forecast error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch forecast');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchForecast();
    
    if (autoRefresh) {
      const interval = setInterval(fetchForecast, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [selectedMetric, autoRefresh]);

  // Chart data for trajectory
  const trajectoryChartData = useMemo(() => {
    if (!forecastData?.trajectory) {
      return {
        labels: [],
        datasets: []
      };
    }

    const labels = forecastData.trajectory.map(point => point.timestamp);
    
    const datasets = [];

    // Main prediction line
    if (selectedMetric === 'MAP') {
      datasets.push({
        label: 'Predicted MAP',
        data: forecastData.trajectory.map(point => point.predicted_MAP),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      });

      // Add danger zone
      datasets.push({
        label: 'Hypotension Threshold',
        data: new Array(labels.length).fill(65),
        borderColor: 'rgb(220, 38, 38)',
        backgroundColor: 'rgba(220, 38, 38, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      });
    } else if (selectedMetric === 'HR') {
      datasets.push({
        label: 'Predicted Heart Rate',
        data: forecastData.trajectory.map(point => point.predicted_HR),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      });
    } else if (selectedMetric === 'SpO2') {
      datasets.push({
        label: 'Predicted SpO₂',
        data: forecastData.trajectory.map(point => point.predicted_SpO2),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      });

      // Add danger zone for SpO2
      datasets.push({
        label: 'Hypoxemia Threshold',
        data: new Array(labels.length).fill(95),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0
      });
    }

    return { labels, datasets };
  }, [forecastData, selectedMetric]);

  const trajectoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            const value = context.parsed.y;
            let unit = '';
            if (selectedMetric === 'MAP') unit = ' mmHg';
            else if (selectedMetric === 'HR') unit = ' bpm';
            else if (selectedMetric === 'SpO2') unit = '%';
            
            return `${context.dataset.label}: ${value.toFixed(1)}${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (Next 30 minutes)'
        }
      },
      y: {
        title: {
          display: true,
          text: getYAxisTitle()
        },
        beginAtZero: false
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  };

  function getYAxisTitle(): string {
    switch (selectedMetric) {
      case 'MAP': return 'Mean Arterial Pressure (mmHg)';
      case 'HR': return 'Heart Rate (bpm)';
      case 'SpO2': return 'Oxygen Saturation (%)';
      default: return '';
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderExplanations = () => {
    if (!forecastData?.explanations) return null;

    const sortedExplanations = [...forecastData.explanations]
      .sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance))
      .slice(0, expanded ? 6 : 3);

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Feature Importance (SHAP)</h4>
        <div className="space-y-2">
          {sortedExplanations.map((explanation, index) => {
            const absImportance = Math.abs(explanation.importance);
            const maxImportance = Math.max(...forecastData.explanations.map(e => Math.abs(e.importance)));
            const widthPercent = (absImportance / maxImportance) * 100;
            const isPositive = explanation.importance > 0;

            return (
              <div key={explanation.feature} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{explanation.feature}</span>
                  <span className="text-gray-600">
                    {explanation.value.toFixed(1)} 
                    {explanation.feature === 'MAP' && ' mmHg'}
                    {explanation.feature === 'HR' && ' bpm'}
                    {explanation.feature === 'SpO2' && '%'}
                    {explanation.feature === 'RR' && ' /min'}
                    {explanation.feature === 'Temp' && '°C'}
                    {explanation.feature === 'EtCO2' && ' mmHg'}
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isPositive ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isPositive ? 'Increases' : 'Decreases'} risk by {(absImportance * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRiskGauge = () => {
    if (!forecastData) return null;

    const riskPercent = forecastData.hypotension_risk * 100;
    const strokeColor = riskPercent > 70 ? '#dc2626' : riskPercent > 40 ? '#d97706' : '#059669';

    return (
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeDasharray={`${riskPercent}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: strokeColor }}>
                {riskPercent.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Risk</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !forecastData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Clinical Risk Forecast</h3>
          <p className="text-sm text-gray-500">AI-powered predictive analytics with clinical reasoning</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Metric Selector */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as 'MAP' | 'HR' | 'SpO2')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="MAP">MAP Forecast</option>
            <option value="HR">Heart Rate</option>
            <option value="SpO2">SpO₂ Forecast</option>
          </select>

          {/* Auto-refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              autoRefresh 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {autoRefresh ? '🔄 Auto' : '⏸ Manual'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchForecast}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">⚠️ {error}</p>
        </div>
      )}

      {forecastData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trajectory Chart */}
          <div className="lg:col-span-2">
            <div className="h-64 mb-4">
              <LineChart data={trajectoryChartData} options={trajectoryChartOptions} />
            </div>
            
            {/* Clinical Reasoning */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🧠 Clinical Reasoning</h4>
              <p className="text-sm text-blue-800">{forecastData.reason}</p>
              <div className="mt-2 text-xs text-blue-600">
                Model confidence: {(forecastData.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Risk Summary */}
          <div className="space-y-6">
            {/* Risk Gauge */}
            <div className="text-center">
              <h4 className="font-medium text-gray-900 mb-3">Hypotension Risk</h4>
              {renderRiskGauge()}
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-3 ${getRiskColor(forecastData.risk_level)}`}>
                {forecastData.risk_level} RISK
              </div>
            </div>

            {/* Feature Explanations */}
            {expanded && renderExplanations()}
          </div>
        </div>
      )}

      {/* Expanded View Additional Content */}
      {expanded && forecastData && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clinical Interventions */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-3">💡 Suggested Interventions</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                {forecastData.risk_level === 'HIGH' && (
                  <>
                    <li>• Consider fluid bolus if hypovolemic</li>
                    <li>• Evaluate vasopressor need</li>
                    <li>• Reduce anesthetic depth if appropriate</li>
                  </>
                )}
                {forecastData.risk_level === 'MEDIUM' && (
                  <>
                    <li>• Monitor trends closely</li>
                    <li>• Prepare fluid challenge</li>
                    <li>• Consider position change</li>
                  </>
                )}
                {forecastData.risk_level === 'LOW' && (
                  <>
                    <li>• Continue current management</li>
                    <li>• Routine monitoring sufficient</li>
                  </>
                )}
              </ul>
            </div>

            {/* Model Metadata */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">🔬 Model Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Algorithm: Random Forest + SHAP</div>
                <div>Features: 6 vital parameters</div>
                <div>Validation: MIMIC-IV derived</div>
                <div>Update frequency: 15 seconds</div>
                <div>Prediction horizon: 30 minutes</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}