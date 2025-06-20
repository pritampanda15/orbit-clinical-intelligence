// src/components/VitalsPlot.tsx - Advanced Vitals Plotting Component
import React, { useMemo, useState } from 'react';
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
  Legend
);

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

interface VitalsPlotProps {
  data: VitalsData[];
  showAllVitals?: boolean;
  height?: number;
}

interface VitalConfig {
  key: keyof VitalsData;
  label: string;
  color: string;
  yAxisID: string;
  normalRange: [number, number];
  unit: string;
  precision: number;
}

const VITAL_CONFIGS: VitalConfig[] = [
  {
    key: 'MAP',
    label: 'Mean Arterial Pressure',
    color: 'rgb(239, 68, 68)', // red-500
    yAxisID: 'y',
    normalRange: [65, 100],
    unit: 'mmHg',
    precision: 1
  },
  {
    key: 'HR',
    label: 'Heart Rate',
    color: 'rgb(59, 130, 246)', // blue-500
    yAxisID: 'y1',
    normalRange: [60, 100],
    unit: 'bpm',
    precision: 0
  },
  {
    key: 'SpO2',
    label: 'Oxygen Saturation',
    color: 'rgb(16, 185, 129)', // emerald-500
    yAxisID: 'y2',
    normalRange: [95, 100],
    unit: '%',
    precision: 1
  },
  {
    key: 'RR',
    label: 'Respiratory Rate',
    color: 'rgb(168, 85, 247)', // purple-500
    yAxisID: 'y3',
    normalRange: [12, 20],
    unit: '/min',
    precision: 0
  },
  {
    key: 'Temp',
    label: 'Temperature',
    color: 'rgb(245, 158, 11)', // amber-500
    yAxisID: 'y4',
    normalRange: [36.0, 37.5],
    unit: '°C',
    precision: 1
  },
  {
    key: 'EtCO2',
    label: 'End-tidal CO₂',
    color: 'rgb(236, 72, 153)', // pink-500
    yAxisID: 'y5',
    normalRange: [30, 40],
    unit: 'mmHg',
    precision: 1
  }
];

export default function VitalsPlot({ data, showAllVitals = false, height = 400 }: VitalsPlotProps) {
  const [selectedVitals, setSelectedVitals] = useState<Set<string>>(
    new Set(showAllVitals ? VITAL_CONFIGS.map(v => v.key) : ['MAP', 'HR', 'SpO2'])
  );

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Take last 50 data points for performance
    const recentData = data.slice(-50);
    const labels = recentData.map(d => d.timestamp);

    const datasets = VITAL_CONFIGS
      .filter(config => selectedVitals.has(config.key))
      .map(config => {
        const values = recentData.map(d => {
          const value = d[config.key];
          return typeof value === 'number' ? Number(value.toFixed(config.precision)) : null;
        });

        return {
          label: config.label,
          data: values,
          borderColor: config.color,
          backgroundColor: config.color + '20', // Add transparency
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          pointRadius: 2,
          pointHoverRadius: 4,
          yAxisID: config.yAxisID,
          spanGaps: true
        };
      });

    return { labels, datasets };
  }, [data, selectedVitals]);

  const chartOptions = useMemo(() => {
    const getScaleConfig = (config: VitalConfig) => ({
      type: 'linear' as const,
      display: selectedVitals.has(config.key),
      position: (['y', 'y1'].includes(config.yAxisID) ? 'left' : 'right') as const,
      title: {
        display: true,
        text: `${config.label} (${config.unit})`,
        color: config.color,
        font: {
          size: 11,
          weight: 'bold' as const
        }
      },
      ticks: {
        color: config.color,
        font: {
          size: 10
        },
        callback: function(value: any) {
          return Number(value).toFixed(config.precision);
        }
      },
      grid: {
        display: config.yAxisID === 'y',
        color: 'rgba(0, 0, 0, 0.1)'
      }
    });

    const scales: any = {};
    VITAL_CONFIGS.forEach(config => {
      scales[config.yAxisID] = getScaleConfig(config);
    });

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          callbacks: {
            afterTitle: function(context: TooltipItem<'line'>[]) {
              if (context.length > 0) {
                return `Time: ${context[0].label}`;
              }
              return '';
            },
            label: function(context: TooltipItem<'line'>) {
              const config = VITAL_CONFIGS.find(c => c.label === context.dataset.label);
              if (!config) return '';
              
              const value = context.parsed.y;
              const isNormal = value >= config.normalRange[0] && value <= config.normalRange[1];
              const status = isNormal ? '✓' : '⚠';
              
              return `${status} ${config.label}: ${value.toFixed(config.precision)} ${config.unit}`;
            }
          }
        }
      },
      scales,
      elements: {
        point: {
          hoverRadius: 6
        }
      },
      animation: {
        duration: 300
      }
    };
  }, [selectedVitals]);

  const toggleVital = (vitalKey: string) => {
    setSelectedVitals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vitalKey)) {
        newSet.delete(vitalKey);
      } else {
        newSet.add(vitalKey);
      }
      return newSet;
    });
  };

  const getLatestValues = () => {
    if (!data || data.length === 0) return {};
    const latest = data[data.length - 1];
    return latest;
  };

  const getVitalStatus = (config: VitalConfig, value: number) => {
    if (value >= config.normalRange[0] && value <= config.normalRange[1]) {
      return 'normal';
    }
    return 'abnormal';
  };

  const latestValues = getLatestValues();

  return (
    <div className="space-y-4">
      {/* Vital Signs Selection */}
      <div className="flex flex-wrap gap-2">
        {VITAL_CONFIGS.map(config => {
          const isSelected = selectedVitals.has(config.key);
          const latestValue = latestValues[config.key];
          const status = typeof latestValue === 'number' ? getVitalStatus(config, latestValue) : 'unknown';
          
          return (
            <button
              key={config.key}
              onClick={() => toggleVital(config.key)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                isSelected
                  ? 'border-transparent shadow-sm'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: isSelected ? config.color + '20' : undefined,
                borderColor: isSelected ? config.color : undefined,
                color: isSelected ? config.color : undefined
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span>{config.key}</span>
              {typeof latestValue === 'number' && (
                <span className={`font-bold ${status === 'normal' ? 'text-green-600' : 'text-red-600'}`}>
                  {latestValue.toFixed(config.precision)}
                </span>
              )}
              {status === 'abnormal' && <span className="text-red-500">⚠</span>}
            </button>
          );
        })}
      </div>

      {/* Chart Container */}
      <div className="relative bg-gray-50 rounded-lg p-4" style={{ height }}>
        {data && data.length > 0 ? (
          <LineChart data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <div className="text-lg font-medium">Waiting for vitals data...</div>
              <div className="text-sm">Real-time monitoring will appear here</div>
            </div>
          </div>
        )}
      </div>

      {/* Current Values Summary */}
      {data && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {VITAL_CONFIGS.map(config => {
            const value = latestValues[config.key];
            if (typeof value !== 'number') return null;
            
            const status = getVitalStatus(config, value);
            const isSelected = selectedVitals.has(config.key);
            
            return (
              <div
                key={config.key}
                className={`p-3 rounded-lg border ${
                  status === 'normal' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">{config.key}</span>
                  {status === 'abnormal' && <span className="text-red-500 text-xs">⚠</span>}
                </div>
                <div className="flex items-baseline space-x-1">
                  <span 
                    className={`text-lg font-bold ${
                      status === 'normal' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {value.toFixed(config.precision)}
                  </span>
                  <span className="text-xs text-gray-500">{config.unit}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Normal: {config.normalRange[0]}-{config.normalRange[1]}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}