import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Code, Download, Loader2, Lock, RotateCcw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { usePayment } from '../context/PaymentContext';
import { authApi, reportApi } from '../services/apiClient';
import { EnhancedTimelineView } from './EnhancedTimelineView';
import { TimelinePeriod } from './TimelineView';

interface ReportDisplayProps {
  report: string;
  onStartOver: () => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ 
  report, 
  onStartOver 
}) => {
  const [overview, setOverview] = useState<string>('');
  const [nextSteps, setNextSteps] = useState<string>('');
  const [timelineData, setTimelineData] = useState<TimelinePeriod[] | null>(null);
  const [betaCodeInput, setBetaCodeInput] = useState('');
  const [showBetaDialog, setShowBetaDialog] = useState(false);
  const [betaError, setBetaError] = useState<string | null>(null);
  
  // Get payment state from context
  const { isPaid, setIsPaid, initiatePayment, isProcessingPayment } = usePayment();

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

  const handlePDFDownload = async () => {
    try {
      // Get the current report ID from localStorage
      const reportId = localStorage.getItem('current_report_id');
      
      if (!reportId) {
        console.error('No report ID found for PDF download');
        return;
      }
      
      // Call the backend API to generate and download the PDF
      await reportApi.downloadReportPdf(reportId);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  // Get the overview - now returning the full overview for all users
  const getOverview = () => {
    return overview;
  };

  // Get a limited version of the timeline data for unpaid users
  const getLimitedTimelineData = () => {
    if (!timelineData) return null;
    
    // Show 60% of the timeline data for free users
    if (isPaid) {
      return timelineData;
    } else {
      const visibleCount = Math.ceil(timelineData.length * 0.6);
      return timelineData.slice(0, visibleCount);
    }
  };

  const handlePaymentClick = () => {
    initiatePayment('0.01', 'USD');
  };

  const handleBetaCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setBetaError(null);
      // Call the backend API to verify the beta code
      const response = await authApi.verifyBetaCode(betaCodeInput);
      
      if (response.success) {
        // Update the payment state
        setIsPaid(true);
        setShowBetaDialog(false);
        console.log("Beta code verified successfully - unlocking report");
      } else {
        setBetaError('Invalid beta code. Please try again.');
      }
    } catch (error) {
      console.error("Beta code verification error:", error);
      setBetaError('Error verifying beta code. Please try again.');
    }
  };

  // Reset beta code input when report changes
  useEffect(() => {
    if (report) {
      setBetaCodeInput('');
      setBetaError(null);
      console.log("New report loaded - beta code state reset");
    }
  }, [report]);

  return (
    <div className="report-display space-y-8 max-w-full overflow-hidden">
      {/* Overview Section - Concise */}
      <section className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center">
          <h2 className="text-gray-800">Overview</h2>
        </div>
        
        <div 
          className="mt-3 prose prose-sm max-w-none text-gray-600 font-body overflow-hidden" 
          dangerouslySetInnerHTML={{ __html: getOverview() }} 
        />
      </section>
      
      {/* Timeline Section */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-gray-800">Application Timeline</h2>
          {!isPaid && (
            <div className="flex items-center">
              <Lock className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-xs text-gray-500">Partial view for free users</span>
            </div>
          )}
        </div>
        
        <div className="p-5">
          {/* Only render EnhancedTimelineView if there's valid timeline data */}
          {timelineData && Array.isArray(timelineData) ? (
            <EnhancedTimelineView timelineData={getLimitedTimelineData() || []} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Timeline data is loading or not available.</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Payment CTA - Show only for unpaid users, moved below timeline */}
      {!isPaid && (
        <div className="bg-academic-cream/80 rounded-lg p-6 border border-academic-gold/50 shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-academic-navy mb-2">
                <Lock className="inline-block mr-2 h-5 w-5" />
                Unlock Your Complete College Application Plan
              </h3>
              <p className="text-academic-slate mb-2">
                Get your full application timeline and step-by-step guidance with detailed recommendations.
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
                <>Unlock Full Report - $0.01</>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Next Steps Section - Show premium message for unpaid users */}
      <section className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 overflow-hidden">
        <h2 className="text-gray-800">Immediate Next Steps</h2>
        
        {isPaid ? (
          <div className="mt-4 prose prose-sm max-w-none text-gray-700 overflow-hidden" 
               dangerouslySetInnerHTML={{ __html: nextSteps }} />
        ) : (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-academic-slate flex items-center">
              <Lock className="mr-2 h-4 w-4" />
              Premium Content: Immediate Next Steps
            </p>
            <p className="mt-2 text-gray-600">
              Upgrade to access 5 personalized, immediately actionable recommendations 
              to strengthen your college application strategy.
            </p>
          </div>
        )}
      </section>
      
      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={onStartOver}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Start Over
          </Button>
          
          {/* Beta code button - shown for unpaid users */}
          {!isPaid && (
            <Button
              variant="outline"
              onClick={() => setShowBetaDialog(true)}
              className="flex items-center gap-2 border-academic-navy text-academic-navy"
            >
              <Code className="h-4 w-4" />
              Beta Code
            </Button>
          )}
        </div>
        
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
                Unlock Full Report - $0.01
              </>
            )}
          </Button>
        )}
      </div>

      {/* Beta Code Dialog */}
      <Dialog open={showBetaDialog} onOpenChange={setShowBetaDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Enter Beta Tester Code</DialogTitle>
            <DialogDescription>
              If you have a beta tester code, enter it below to unlock the full report.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input
              placeholder="Enter your beta code"
              value={betaCodeInput}
              onChange={(e) => setBetaCodeInput(e.target.value)}
              className={betaError ? "border-red-500" : ""}
            />
            {betaError && (
              <p className="text-red-500 text-sm">{betaError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBetaDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBetaCodeSubmit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportDisplay; 