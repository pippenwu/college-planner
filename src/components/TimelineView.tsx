import { Book, Calendar, ChevronLeft, ChevronRight, FileText, Trophy } from 'lucide-react';
import React, { useState } from 'react';

export interface TimelineEvent {
  title: string;
  category: string;
  description: string;
  deadline: string;
  url?: string;
}

export interface TimelinePeriod {
  period: string;
  events: TimelineEvent[];
  tasks?: string[];
}

interface TimelineViewProps {
  timelineData: TimelinePeriod[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timelineData }) => {
  const [activePeriodIndex, setActivePeriodIndex] = useState(0);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);

  if (!timelineData || !timelineData.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        <p>No timeline data available.</p>
      </div>
    );
  }

  const handleNextPeriod = () => {
    if (activePeriodIndex < timelineData.length - 1) {
      setActivePeriodIndex(activePeriodIndex + 1);
      setSelectedEventIndex(null);
    }
  };

  const handlePrevPeriod = () => {
    if (activePeriodIndex > 0) {
      setActivePeriodIndex(activePeriodIndex - 1);
      setSelectedEventIndex(null);
    }
  };

  const activePeriod = timelineData[activePeriodIndex];
  const activeEvents = activePeriod?.events || [];

  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "h-5 w-5", "aria-hidden": true };
    
    switch (category.toLowerCase()) {
      case 'academics':
        return <Book {...iconProps} />;
      case 'extracurriculars':
        return <Trophy {...iconProps} />;
      case 'application':
        return <FileText {...iconProps} />;
      default:
        return <Calendar {...iconProps} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academics':
        return 'bg-slate-50 text-academic-navy border-slate-200';
      case 'extracurriculars':
        return 'bg-stone-50 text-academic-slate border-stone-200';
      case 'application':
        return 'bg-gray-50 text-academic-burgundy border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="timeline-view bg-white rounded-lg p-6 shadow-md">
      {/* Period Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePrevPeriod}
          disabled={activePeriodIndex === 0}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </button>
        <h3 className="text-xl font-bold text-gray-800">{activePeriod.period}</h3>
        <button
          onClick={handleNextPeriod}
          disabled={activePeriodIndex === timelineData.length - 1}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      {/* Timeline Track */}
      <div className="timeline-track relative mb-8">
        <div className="h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-blue-600 rounded-full" 
            style={{ 
              width: `${((activePeriodIndex + 1) / timelineData.length) * 100}%` 
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {timelineData.map((period, index) => (
            <div key={index} className={`text-center ${index === activePeriodIndex ? 'font-semibold text-blue-600' : ''}`}>
              <div 
                className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                  index <= activePeriodIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
              <span className="text-xs whitespace-nowrap">{period.period.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Events */}
      <div className="timeline-events mb-6">
        {activeEvents.length > 0 ? (
          <div className="space-y-3">
            {activeEvents.map((event, index) => (
              <div 
                key={index}
                className={`event-card p-4 border rounded-lg cursor-pointer transition ${
                  selectedEventIndex === index 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedEventIndex(index === selectedEventIndex ? null : index)}
              >
                <div className="flex items-start">
                  <div className={`category-icon p-2 rounded-full mr-3 ${getCategoryColor(event.category)}`}>
                    {getCategoryIcon(event.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-semibold text-gray-800">{event.title}</h4>
                      <div className="text-sm text-gray-500">
                        <span>Deadline: {event.deadline}</span>
                      </div>
                    </div>
                    
                    {selectedEventIndex === index && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                        {event.url && (
                          <a 
                            href={event.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            Learn more
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No events planned for this period.</p>
          </div>
        )}
      </div>

      {/* Category Legend */}
      <div className="category-legend mt-8 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Categories:</h4>
        <div className="flex flex-wrap gap-2">
          {['academics', 'extracurriculars', 'application'].map((category) => (
            <div key={category} className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-1 ${getCategoryColor(category).split(' ')[0]}`}></div>
              <span className="text-xs text-gray-600 capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 