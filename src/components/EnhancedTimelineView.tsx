import { Book, Briefcase, Calendar, ChevronRight, FileText, Globe, GraduationCap, Trophy, X } from 'lucide-react';
import React, { useState } from 'react';
import { TimelinePeriod } from './TimelineView';

interface EnhancedTimelineViewProps {
  timelineData: TimelinePeriod[];
}

export const EnhancedTimelineView: React.FC<EnhancedTimelineViewProps> = ({ timelineData }) => {
  const [selectedEvent, setSelectedEvent] = useState<{period: number, event: number} | null>(null);

  if (!timelineData || !timelineData.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        <p>No timeline data available.</p>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "h-5 w-5", "aria-hidden": true };
    
    switch (category.toLowerCase()) {
      case 'academics':
        return <Book {...iconProps} />;
      case 'testing':
        return <FileText {...iconProps} />;
      case 'extracurricular':
        return <Trophy {...iconProps} />;
      case 'internship':
        return <Briefcase {...iconProps} />;
      case 'college-prep':
        return <GraduationCap {...iconProps} />;
      case 'travel':
        return <Globe {...iconProps} />;
      default:
        return <Calendar {...iconProps} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academics':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'testing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'extracurricular':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'internship':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'college-prep':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'travel':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Determine if an event is selected
  const isEventSelected = (periodIndex: number, eventIndex: number) => {
    return selectedEvent?.period === periodIndex && selectedEvent?.event === eventIndex;
  };
  
  // Handle clicking on an event
  const handleEventClick = (periodIndex: number, eventIndex: number) => {
    if (isEventSelected(periodIndex, eventIndex)) {
      setSelectedEvent(null);
    } else {
      setSelectedEvent({ period: periodIndex, event: eventIndex });
    }
  };

  return (
    <div className="enhanced-timeline bg-white rounded-lg shadow-md overflow-hidden">
      {/* Timeline track with all periods */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="timeline-track relative flex items-center">
          <div className="h-2 bg-gray-200 rounded-full flex-1 z-0">
            {timelineData.map((_, index) => (
              <div 
                key={index}
                className="absolute h-2 bg-blue-600 rounded-full" 
                style={{ 
                  left: `${(index / timelineData.length) * 100}%`,
                  width: `${(1 / timelineData.length) * 100}%`,
                  opacity: 0.4 + (index / timelineData.length) * 0.6
                }}
              />
            ))}
          </div>
          
          <div className="absolute inset-x-0 flex justify-between">
            {timelineData.map((period, index) => (
              <div key={index} className="flex flex-col items-center z-10" style={{ 
                left: `calc(${(index / (timelineData.length - 1)) * 100}% - 15px)`
              }}>
                <div className="w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-xs">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Period labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {timelineData.map((period, index) => (
            <div key={index} className="text-center" style={{ width: `${100 / timelineData.length}%` }}>
              <span className="block font-medium">{period.period}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Timeline Content - All periods with their events */}
      <div className="timeline-content p-4">
        {timelineData.map((period, periodIndex) => (
          <div key={periodIndex} className="period-section mb-8 last:mb-0">
            <h3 className="text-lg font-semibold mb-3">{period.period}</h3>
            
            <div className="events-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {period.events.map((event, eventIndex) => (
                <div 
                  key={eventIndex}
                  className={`event-card relative p-4 border rounded-lg cursor-pointer transition-all ${
                    isEventSelected(periodIndex, eventIndex)
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleEventClick(periodIndex, eventIndex)}
                >
                  <div className="flex items-start">
                    <div className={`category-icon p-2 rounded-full mr-3 ${getCategoryColor(event.category)}`}>
                      {getCategoryIcon(event.category)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 pr-5">{event.title}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        <span>Deadline: {event.deadline}</span>
                      </div>
                      
                      {isEventSelected(periodIndex, eventIndex) && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <p className="text-gray-600 text-sm">{event.description}</p>
                          
                          {event.url && (
                            <a 
                              href={event.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              Learn more
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {isEventSelected(periodIndex, eventIndex) && (
                      <button 
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {period.events.length === 0 && (
                <div className="col-span-full text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                  <p>No events scheduled for this period.</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Category Legend */}
      <div className="category-legend p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-3">
          {['academics', 'testing', 'extracurricular', 'college-prep', 'internship'].map((category) => (
            <div key={category} className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-1 ${getCategoryColor(category).split(' ')[0]}`}></div>
              <span className="text-xs text-gray-600 capitalize">{category.replace('-', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 