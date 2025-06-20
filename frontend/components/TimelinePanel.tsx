// src/components/TimelinePanel.tsx - Clinical Events Timeline
import React, { useState, useMemo } from 'react';

interface PatientEvent {
  timestamp: string;
  type: string;
  description: string;
  severity: string;
  source: string;
}

interface TimelinePanelProps {
  events: PatientEvent[];
}

type EventFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
type SourceFilter = 'ALL' | 'MONITOR' | 'USER' | 'SYSTEM';

export default function TimelinePanel({ events }: TimelinePanelProps) {
  const [severityFilter, setSeverityFilter] = useState<EventFilter>('ALL');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const severityMatch = severityFilter === 'ALL' || event.severity === severityFilter;
      const sourceMatch = sourceFilter === 'ALL' || event.source === sourceFilter;
      return severityMatch && sourceMatch;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [events, severityFilter, sourceFilter]);

  const getEventIcon = (type: string, severity: string): string => {
    switch (type) {
      case 'HYPOTENSION': return '🩸';
      case 'TACHYCARDIA': return '💓';
      case 'HYPOXEMIA': return '🫁';
      case 'TEMPERATURE': return '🌡️';
      case 'MEDICATION': return '💊';
      case 'INTERVENTION': return '⚕️';
      case 'ALARM': return '🚨';
      default:
        if (severity === 'HIGH') return '🔴';
        if (severity === 'MEDIUM') return '🟡';
        return '🟢';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'HIGH': return 'border-red-200 bg-red-50 text-red-800';
      case 'MEDIUM': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'LOW': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getSourceColor = (source: string): string => {
    switch (source) {
      case 'MONITOR': return 'bg-blue-100 text-blue-800';
      case 'USER': return 'bg-purple-100 text-purple-800';
      case 'SYSTEM': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string): { time: string; relative: string } => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    let relative = '';
    if (diffMins < 1) relative = 'Just now';
    else if (diffMins < 60) relative = `${diffMins}m ago`;
    else if (diffHours < 24) relative = `${diffHours}h ago`;
    else relative = `${Math.floor(diffHours / 24)}d ago`;

    return {
      time: date.toLocaleTimeString(),
      relative
    };
  };

  const eventCounts = useMemo(() => {
    const counts = {
      total: events.length,
      high: events.filter(e => e.severity === 'HIGH').length,
      medium: events.filter(e => e.severity === 'MEDIUM').length,
      low: events.filter(e => e.severity === 'LOW').length,
      monitor: events.filter(e => e.source === 'MONITOR').length,
      user: events.filter(e => e.source === 'USER').length,
      system: events.filter(e => e.source === 'SYSTEM').length,
    };
    return counts;
  }, [events]);

  const toggleEventExpansion = (timestamp: string) => {
    setExpandedEvent(expandedEvent === timestamp ? null : timestamp);
  };

  const exportTimeline = () => {
    const timelineText = filteredEvents.map(event => 
      `[${event.timestamp}] ${event.severity} - ${event.type}\n${event.description}\nSource: ${event.source}`
    ).join('\n\n');
    
    const blob = new Blob([timelineText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-timeline-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Clinical Timeline</h3>
            <p className="text-sm text-gray-500">Recent patient events and alerts</p>
          </div>
          
          <button
            onClick={exportTimeline}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
            title="Export Timeline"
          >
            📁
          </button>
        </div>

        {/* Event Statistics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-md p-2">
            <span className="font-medium">Total Events:</span>
            <span className="ml-1">{eventCounts.total}</span>
          </div>
          <div className="bg-red-50 rounded-md p-2">
            <span className="font-medium text-red-700">High:</span>
            <span className="ml-1 text-red-700">{eventCounts.high}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Severity:</label>
            <div className="flex space-x-1">
              {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as EventFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setSeverityFilter(filter)}
                  className={`px-2 py-1 text-xs rounded ${
                    severityFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Source:</label>
            <div className="flex space-x-1">
              {(['ALL', 'MONITOR', 'USER', 'SYSTEM'] as SourceFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setSourceFilter(filter)}
                  className={`px-2 py-1 text-xs rounded ${
                    sourceFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredEvents.length > 0 ? (
          <div className="space-y-3">
            {filteredEvents.map((event, index) => {
              const timestamps = formatTimestamp(event.timestamp);
              const isExpanded = expandedEvent === event.timestamp;
              
              return (
                <div
                  key={`${event.timestamp}-${index}`}
                  className={`border rounded-lg p-3 transition-all cursor-pointer ${getSeverityColor(event.severity)} ${
                    isExpanded ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => toggleEventExpansion(event.timestamp)}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      <span className="text-lg">
                        {getEventIcon(event.type, event.severity)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {event.type.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getSourceColor(event.source)}`}>
                            {event.source}
                          </span>
                        </div>
                        <p className="text-sm">{event.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right text-xs text-gray-500 ml-2">
                      <div>{timestamps.time}</div>
                      <div className="font-medium">{timestamps.relative}</div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="font-medium">Event Type:</span>
                          <span className="ml-1">{event.type}</span>
                        </div>
                        <div>
                          <span className="font-medium">Severity:</span>
                          <span className="ml-1">{event.severity}</span>
                        </div>
                        <div>
                          <span className="font-medium">Source:</span>
                          <span className="ml-1">{event.source}</span>
                        </div>
                        <div>
                          <span className="font-medium">Timestamp:</span>
                          <span className="ml-1">{event.timestamp}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <span className="font-medium text-xs">Full Description:</span>
                        <p className="text-xs mt-1 bg-white bg-opacity-50 rounded p-2">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <div className="text-lg font-medium">No events found</div>
              <div className="text-sm">
                {events.length === 0 
                  ? 'No events have been recorded yet'
                  : 'No events match your current filters'
                }
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredEvents.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            Showing {filteredEvents.length} of {events.length} events
            {(severityFilter !== 'ALL' || sourceFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSeverityFilter('ALL');
                  setSourceFilter('ALL');
                }}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}