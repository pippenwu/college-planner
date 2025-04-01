import { ChevronDown, ChevronUp, Download, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { generatePDF } from '../utils/pdfUtils';
import { EnhancedTimelineView } from './EnhancedTimelineView';
import { TimelinePeriod } from './TimelineView';
import { Button } from './ui/button';

interface ReportDisplayProps {
  report: string;
  studentName?: string;
  studentGrade?: string;
  onStartOver: () => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ 
  report, 
  studentName,
  studentGrade,
  onStartOver 
}) => {
  const [overview, setOverview] = useState<string>('');
  const [nextSteps, setNextSteps] = useState<string>('');
  const [timelineData, setTimelineData] = useState<TimelinePeriod[] | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'next-steps'>('overview');
  const [showNextSteps, setShowNextSteps] = useState(false);

  useEffect(() => {
    if (report) {
      parseReport(report);
    }
  }, [report]);

  const parseReport = (htmlContent: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Extract overview section
      const overviewSection = doc.getElementById('overview');
      if (overviewSection) {
        // Remove the heading
        const heading = overviewSection.querySelector('h2');
        if (heading) heading.remove();
        
        setOverview(overviewSection.innerHTML);
      }
      
      // Extract next steps section
      const nextStepsSection = doc.getElementById('next-steps');
      if (nextStepsSection) {
        // Remove the heading
        const heading = nextStepsSection.querySelector('h2');
        if (heading) heading.remove();
        
        setNextSteps(nextStepsSection.innerHTML);
      }
      
      // Extract timeline data
      const timelineSection = doc.getElementById('timeline');
      
      if (timelineSection) {
        // Look for timeline data between the tags
        const timelineMatch = timelineSection.innerHTML.match(/<timeline-data>([\s\S]*?)<\/timeline-data>/i);
        
        if (timelineMatch && timelineMatch[1]) {
          try {
            // Clean the JSON string before parsing
            const jsonString = timelineMatch[1]
              .trim()
              .replace(/\\"/g, '"') // Fix escaped quotes
              .replace(/(\r\n|\n|\r)/gm, "") // Remove newlines
              .replace(/\s+/g, " "); // Normalize whitespace
            
            // Try to parse the cleaned JSON
            const timelineJSON = JSON.parse(jsonString);
            setTimelineData(timelineJSON);
          } catch (err) {
            console.error('Failed to parse timeline data:', err);
            // Fallback to default timeline
            setTimelineData(getFallbackTimelineData());
          }
        } else {
          console.error('No timeline data found in the report');
          setTimelineData(getFallbackTimelineData());
        }
      }
    } catch (error) {
      console.error('Error parsing report:', error);
      setTimelineData(getFallbackTimelineData());
    }
  };
  
  // Provide a simple fallback when parsing fails
  const getFallbackTimelineData = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    return [
      {
        "period": "Current Semester",
        "events": [
          {
            "title": "Focus on Academics",
            "category": "academics",
            "description": "Maintain or improve your GPA in core academic subjects.",
            "deadline": "Ongoing"
          },
          {
            "title": "Standardized Test Prep",
            "category": "academics",
            "description": "Begin preparation for SAT or ACT by taking practice tests and identifying areas for improvement.",
            "deadline": `${currentYear}-12-31`
          }
        ]
      },
      {
        "period": `Spring ${currentYear}`,
        "events": [
          {
            "title": "Join Extracurricular Activities",
            "category": "extracurriculars",
            "description": "Participate in clubs or activities aligned with your interests or intended major.",
            "deadline": `${currentYear}-03-15`
          },
          {
            "title": "Research Summer Programs",
            "category": "extracurriculars",
            "description": "Look for summer enrichment programs, internships, or volunteer opportunities.",
            "deadline": `${currentYear}-04-30`
          }
        ]
      },
      {
        "period": `Fall ${nextYear}`,
        "events": [
          {
            "title": "Begin College Research",
            "category": "application",
            "description": "Start researching colleges that match your academic interests, location preferences, and other criteria.",
            "deadline": `${nextYear}-09-30`
          },
          {
            "title": "Plan College Visits",
            "category": "application",
            "description": "Schedule visits to college campuses you're interested in attending.",
            "deadline": `${nextYear}-10-31`
          }
        ]
      }
    ];
  };

  const handlePDFDownload = () => {
    if (report) {
      generatePDF(report, studentName || 'Student');
    }
  };

  return (
    <div className="report-display space-y-8">
      {/* Overview Section - Concise */}
      <section className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
        </div>
        
        <div className="mt-3 prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: overview }} />
      </section>
      
      {/* Timeline Section - Main Focus */}
      <section className="relative">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Your College Application Timeline</h2>
        {timelineData ? (
          <EnhancedTimelineView timelineData={timelineData} />
        ) : (
          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <p className="text-gray-500">
              Timeline data could not be loaded properly.
            </p>
          </div>
        )}
      </section>
      
      {/* Next Steps Section - Simple List */}
      <section className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <button 
          className="w-full flex justify-between items-center text-left" 
          onClick={() => setShowNextSteps(!showNextSteps)}
        >
          <h2 className="text-lg font-semibold text-gray-800">Immediate Next Steps</h2>
          {showNextSteps ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {showNextSteps && (
          <div className="mt-4 prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: nextSteps }} />
        )}
      </section>
      
      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          onClick={onStartOver}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Start Over
        </Button>
        <Button 
          onClick={handlePDFDownload}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Plan (PDF)
        </Button>
      </div>
    </div>
  );
};

export default ReportDisplay; 