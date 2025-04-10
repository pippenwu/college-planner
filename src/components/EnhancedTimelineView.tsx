import { Book, Calendar, ChevronRight, FileText, Lock, Trophy } from 'lucide-react';
import React, { useState } from 'react';
import { TimelinePeriod } from './TimelineView';

interface EnhancedTimelineViewProps {
  timelineData: TimelinePeriod[];
  fullTimelineData?: TimelinePeriod[];
  isPaid?: boolean;
  legendPrefix?: React.ReactNode;
}

export const EnhancedTimelineView: React.FC<EnhancedTimelineViewProps> = ({ 
  timelineData, 
  fullTimelineData, 
  isPaid = false,
  legendPrefix
}) => {
  const [selectedEvent, setSelectedEvent] = useState<{period: number, event: number} | null>(null);
  
  // Determine which timeline data to use for display
  const displayData = timelineData;
  
  // Use fullTimelineData for the timeline track if provided, otherwise fall back to timelineData
  const trackData = fullTimelineData && !isPaid ? fullTimelineData : timelineData;

  // Ensure displayData is an array and not empty
  if (!displayData || !Array.isArray(displayData) || displayData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        <p>No timeline data available.</p>
      </div>
    );
  }

  // Determine if a period is unlocked (available in the free version)
  const isPeriodUnlocked = (periodIndex: number) => {
    if (isPaid) return true;
    return periodIndex < displayData.length;
  };

  const getCategoryIcon = (category: string) => {
    const iconProps = { className: "h-5 w-5", "aria-hidden": true };
    
    switch (category?.toLowerCase() || 'default') {
      case 'academics':
        return <Book {...iconProps} />;
      case 'standardized testing':
        return <FileText {...iconProps} />;
      case 'extracurricular activities':
      case 'extracurriculars':
        return <Trophy {...iconProps} />;
      case 'summer activities':
        return <Calendar {...iconProps} />;
      case 'essay brainstorming & application "theme"':
      case 'essay brainstorming':
        return <FileText {...iconProps} />;
      case 'letters of recommendation':
        return <FileText {...iconProps} />;
      case 'application':
        return <FileText {...iconProps} />;
      default:
        return <Calendar {...iconProps} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase() || 'default') {
      case 'academics':
        return 'bg-slate-50 text-academic-navy border-slate-200';
      case 'standardized testing':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'extracurricular activities':
      case 'extracurriculars':
        return 'bg-stone-50 text-academic-slate border-stone-200';
      case 'summer activities':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'essay brainstorming & application "theme"':
      case 'essay brainstorming':
        return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'letters of recommendation':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'application':
        return 'bg-gray-50 text-academic-burgundy border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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

  // Convert timeline tasks format to events format if needed
  const processTimelineData = (data: TimelinePeriod[]) => {
    return data.map(period => {
      // Check if period has events array
      if (Array.isArray(period.events)) {
        return period;
      }
      
      // If period has tasks array instead of events (from Gemini API)
      if (Array.isArray(period.tasks)) {
        return {
          period: period.period,
          events: period.tasks.map((task: string) => ({
            title: task,
            category: 'Application',
            description: task,
            deadline: 'Ongoing',
            url: undefined // Add url property to match TimelineEvent interface
          }))
        };
      }
      
      // Default case: return period with empty events array
      return {
        ...period,
        events: []
      };
    });
  };

  const processedDisplayData = processTimelineData(displayData);
  const processedTrackData = processTimelineData(trackData);

  return (
    <div className="enhanced-timeline bg-white rounded-lg shadow-md overflow-hidden">
      {/* Timeline track with all periods */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="timeline-track relative flex items-center">
          <div className="h-2 bg-gray-200 rounded-full flex-1 z-0">
            {processedTrackData.map((_, index) => (
              <div 
                key={index}
                className="absolute h-2 bg-blue-600 rounded-full" 
                style={{ 
                  left: `${(index / processedTrackData.length) * 100}%`,
                  width: `${(1 / processedTrackData.length) * 100}%`,
                  opacity: 0.4 + (index / processedTrackData.length) * 0.6
                }}
              />
            ))}
          </div>
          
          <div className="absolute inset-x-0 flex justify-between">
            {processedTrackData.map((_, index) => (
              <div key={index} className="flex flex-col items-center z-10" style={{ 
                left: `calc(${(index / (processedTrackData.length - 1)) * 100}% - 15px)`
              }}>
                <div className={`w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center text-xs
                  ${isPeriodUnlocked(index) ? 'border-blue-600' : 'border-gray-400'}`}>
                  {isPeriodUnlocked(index) ? (
                    index + 1
                  ) : (
                    <Lock className="h-3 w-3 text-gray-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Period labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {processedTrackData.map((period, index) => (
            <div key={index} className="text-center" style={{ width: `${100 / processedTrackData.length}%` }}>
              <span className={`block font-medium ${!isPeriodUnlocked(index) ? 'text-gray-400' : ''}`}>
                {period.period}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Timeline Content - Only show unlocked periods with their events */}
      <div className="timeline-content p-4">
        {processedDisplayData.map((period, periodIndex) => (
          <div key={periodIndex} className="period-section mb-8 last:mb-0">
            <h3 className="text-lg font-semibold mb-3">{period.period}</h3>
            
            <div className="events-list space-y-2">
              {Array.isArray(period.events) && period.events.length > 0 ? (
                period.events.map((event, eventIndex) => (
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
                        <div className="flex justify-between">
                          <h4 className="font-semibold text-gray-800">{event.title}</h4>
                        </div>
                        
                        {isEventSelected(periodIndex, eventIndex) && (
                          <div className="mt-3 pt-2 border-t border-gray-100">
                            <p className="text-gray-600 text-sm whitespace-pre-line">
                              {event.description || event.title}
                            </p>
                            
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
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg">
                  No events scheduled for this period.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Render the legend prefix content if provided */}
      {legendPrefix}
      
      {/* Category Legend */}
      <div className="category-legend p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4">
          {['academics', 'standardized testing', 'extracurriculars', 'summer activities', 'essay brainstorming', 'letters of recommendation'].map((category) => (
            <div key={category} className="flex items-center">
              <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center ${getCategoryColor(category)}`}>
                {getCategoryIcon(category)}
              </div>
              <span className="text-sm text-gray-700 capitalize">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 