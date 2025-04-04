import { ChevronDown, ChevronUp, Download, Loader2, Lock, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { usePayment } from '../context/PaymentContext';
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
  
  // Get payment state from context
  const { isPaid, initiatePayment, isProcessingPayment } = usePayment();

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

  // Get a truncated version of the overview for unpaid users
  const getTruncatedOverview = () => {
    // If the user has paid, show the full overview
    if (isPaid) return overview;
    
    // Otherwise, show a truncated version (first 2 paragraphs or ~30% of content)
    const paragraphs = overview.split('</p>');
    if (paragraphs.length <= 2) {
      // If there's only one or two paragraphs, show about 30% of it
      const charLimit = Math.floor(overview.length * 0.3);
      let truncatedText = overview.slice(0, charLimit);
      // Find the last closing tag before the cut
      const lastClosingTagIndex = truncatedText.lastIndexOf('>');
      if (lastClosingTagIndex > 0) {
        truncatedText = overview.slice(0, lastClosingTagIndex + 1);
      }
      return truncatedText + '... <span class="text-academic-burgundy font-semibold">Unlock full report to see more</span>';
    }
    
    // Return just the first two paragraphs
    return paragraphs.slice(0, 2).join('</p>') + '</p><p>... <span class="text-academic-burgundy font-semibold">Unlock full report to see more</span></p>';
  };

  // Get a limited version of the timeline data for unpaid users
  const getLimitedTimelineData = () => {
    if (isPaid || !timelineData) return timelineData;
    
    // Show only the first period for free users
    return timelineData.slice(0, 1);
  };

  const handlePaymentClick = () => {
    initiatePayment('19.99', 'USD');
  };

  return (
    <div className="report-display space-y-8 max-w-full overflow-hidden">
      {/* Overview Section - Concise */}
      <section className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center">
          <h2 className="text-gray-800">Overview</h2>
        </div>
        
        <div 
          className="mt-3 prose prose-sm max-w-none text-gray-600 font-body overflow-hidden" 
          dangerouslySetInnerHTML={{ __html: getTruncatedOverview() }} 
        />
      </section>
      
      {/* Payment CTA - Show only for unpaid users */}
      {!isPaid && (
        <div className="bg-academic-cream/80 rounded-lg p-6 border border-academic-gold/50 shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-academic-navy mb-2">
                <Lock className="inline-block mr-2 h-5 w-5" />
                Unlock Your Complete College Application Plan
              </h3>
              <p className="text-academic-slate mb-2">
                Get your full, personalized report with detailed action items, timeline, and strategic recommendations.
              </p>
              <ul className="text-sm text-academic-slate space-y-1 mb-4">
                <li className="flex items-center">
                  <span className="text-academic-burgundy mr-2">✓</span> 
                  Complete application timeline with all key deadlines
                </li>
                <li className="flex items-center">
                  <span className="text-academic-burgundy mr-2">✓</span> 
                  Detailed next steps customized to your profile
                </li>
                <li className="flex items-center">
                  <span className="text-academic-burgundy mr-2">✓</span> 
                  Strategic recommendations for essays and activities
                </li>
              </ul>
            </div>
            <Button
              onClick={handlePaymentClick}
              disabled={isProcessingPayment}
              className="bg-academic-burgundy hover:bg-academic-navy text-white px-6 py-3 text-lg rounded-lg shadow-lg transition-all hover:shadow-xl min-w-44"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Unlock Full Report - $19.99</>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Timeline Section - Main Focus */}
      <section className="relative overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-gray-800">Your College Application Timeline</h2>
          {!isPaid && (
            <span className="text-xs bg-academic-gold/20 text-academic-burgundy px-2 py-1 rounded-full">
              Preview - {timelineData?.length ? '1 of ' + timelineData.length + ' periods shown' : ''}
            </span>
          )}
        </div>
        
        {getLimitedTimelineData() ? (
          <EnhancedTimelineView timelineData={getLimitedTimelineData()} />
        ) : (
          <div className="bg-white rounded-lg p-6 shadow-md text-center">
            <p className="text-gray-500">
              Timeline data could not be loaded properly.
            </p>
          </div>
        )}
        
        {/* Show a locked indicator for unpaid users */}
        {!isPaid && timelineData && timelineData.length > 1 && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
            <p className="text-academic-slate flex items-center justify-center">
              <Lock className="mr-2 h-4 w-4" />
              {timelineData.length - 1} more periods available in the full report
            </p>
          </div>
        )}
      </section>
      
      {/* Next Steps Section - Simple List - Only visible for paid users */}
      {isPaid && (
        <section className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 overflow-hidden">
          <button 
            className="w-full flex justify-between items-center text-left" 
            onClick={() => setShowNextSteps(!showNextSteps)}
          >
            <h2 className="text-gray-800">Immediate Next Steps</h2>
            {showNextSteps ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          {showNextSteps && (
            <div className="mt-4 prose prose-sm max-w-none text-gray-700 overflow-hidden" dangerouslySetInnerHTML={{ __html: nextSteps }} />
          )}
        </section>
      )}
      
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
        
        {/* Only show download button for paid users */}
        {isPaid && (
          <Button 
            onClick={handlePDFDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Plan (PDF)
          </Button>
        )}
        
        {/* Show payment button for unpaid users */}
        {!isPaid && (
          <Button 
            onClick={handlePaymentClick}
            disabled={isProcessingPayment}
            className="flex items-center gap-2 bg-academic-burgundy hover:bg-academic-navy text-white"
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Unlock Full Report
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReportDisplay; 