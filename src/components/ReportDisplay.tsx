import { ChevronDown, ChevronUp, Download, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { generatePDF } from '../utils/pdfUtils';
import { EnhancedTimelineView } from './EnhancedTimelineView';
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
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [showNextSteps, setShowNextSteps] = useState(false);

  useEffect(() => {
    if (report) {
      parseReport(report);
    }
  }, [report]);

  const parseReport = (htmlContent: string) => {
    try {
      // Parse the report HTML to extract sections
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Extract overview
      const overviewSection = doc.getElementById('overview');
      if (overviewSection) {
        // Get the content excluding the heading
        const content = overviewSection.innerHTML.replace(/<h2>.*?<\/h2>/i, '').trim();
        setOverview(content);
      }
      
      // Extract next steps
      const nextStepsSection = doc.getElementById('next-steps');
      if (nextStepsSection) {
        // Extract list items
        const listItems = nextStepsSection.querySelectorAll('li');
        const steps = Array.from(listItems).map(item => {
          return item.innerHTML
            .replace(/<strong>(.*?)<\/strong>:/, '<strong>$1:</strong> ') // Add space after the colon
            .trim();
        });
        setNextSteps(steps);
      }
      
      // Extract timeline data
      const timelineSection = doc.getElementById('timeline');
      if (timelineSection) {
        const timelineDataElement = timelineSection.querySelector('.timeline-data');
        
        if (timelineDataElement) {
          try {
            const timelineJSON = JSON.parse(timelineDataElement.textContent || '[]');
            setTimelineData(timelineJSON);
          } catch (err) {
            console.error('Failed to parse timeline data:', err);
            setTimelineData(null);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing report:', error);
    }
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
          <ul className="mt-4 space-y-3 list-disc pl-5">
            {nextSteps.map((step, index) => (
              <li key={index} className="text-gray-700" dangerouslySetInnerHTML={{ __html: step }} />
            ))}
          </ul>
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