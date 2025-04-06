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
import React, { useState } from 'react';
import { usePayment } from '../context/PaymentContext';
import { authApi, reportApi } from '../services/apiClient';
import { EnhancedTimelineView } from './EnhancedTimelineView';
import { TimelinePeriod } from './TimelineView';

// Define types for the JSON report structure
export interface ReportData {
  overview: {
    text: string;
  };
  timeline: TimelinePeriod[];
  nextSteps: NextStep[];
}

export interface NextStep {
  title: string;
  description: string;
  priority: number;
}

interface ReportDisplayProps {
  report: ReportData;
  onStartOver: () => void;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({ 
  report, 
  onStartOver 
}) => {
  const [betaCodeInput, setBetaCodeInput] = useState('');
  const [showBetaDialog, setShowBetaDialog] = useState(false);
  const [betaError, setBetaError] = useState<string | null>(null);
  
  // Get payment state from context
  const { isPaid, setIsPaid, initiatePayment, isProcessingPayment } = usePayment();

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

  // Get a limited version of the timeline data for unpaid users
  const getLimitedTimelineData = () => {
    if (!report.timeline) return null;
    
    // Show 60% of the timeline data for free users
    if (isPaid) {
      return report.timeline;
    } else {
      const visibleCount = Math.ceil(report.timeline.length * 0.6);
      return report.timeline.slice(0, visibleCount);
    }
  };

  const handlePaymentClick = () => {
    initiatePayment('0.01', 'USD');
  };

  const handleVerifyBetaCode = async () => {
    if (!betaCodeInput.trim()) {
      setBetaError('Please enter a beta code');
      return;
    }
    
    try {
      const response = await authApi.verifyBetaCode(betaCodeInput);
      
      if (response.success) {
        // Close the dialog
        setShowBetaDialog(false);
        // Reset the input and error
        setBetaCodeInput('');
        setBetaError(null);
        // Set the user as paid
        setIsPaid(true);
      } else {
        setBetaError(response.message || 'Invalid beta code');
      }
    } catch (error) {
      console.error('Error verifying beta code:', error);
      setBetaError('Error verifying code. Please try again.');
    }
  };

  // Render the next steps section
  const renderNextSteps = () => {
    // If user is not paid, show the teaser/limited steps
    if (!isPaid) {
      return (
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
      );
    }

    // Otherwise, render the full next steps
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold text-academic-navy mb-4">Next Steps</h2>
        <div className="space-y-4">
          {report.nextSteps.map((step, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-academic-navy mb-1">
                {index + 1}. {step.title}
              </h3>
              <p className="text-academic-slate">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold text-academic-navy mb-4">Overview</h2>
        <div className="prose prose-slate max-w-none">
          <p>{report.overview.text}</p>
        </div>
      </div>
      
      {/* Timeline Section */}
      <div className="bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-bold text-academic-navy mb-4">Application Timeline</h2>
        <EnhancedTimelineView timelineData={getLimitedTimelineData() || []} />
        
        {!isPaid && (
          <div className="mt-4 p-3 bg-academic-cream/50 border border-academic-gold/30 rounded-md text-sm text-academic-slate">
            <p className="flex items-center">
              <Lock className="h-4 w-4 mr-2 text-academic-gold" />
              <span>This is a partial timeline. Unlock the full report to see all recommended steps.</span>
            </p>
          </div>
        )}
      </div>
      
      {/* Next Steps Section */}
      {renderNextSteps()}
      
      {/* Beta Code Dialog */}
      <Dialog open={showBetaDialog} onOpenChange={setShowBetaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Beta Access Code</DialogTitle>
            <DialogDescription>
              If you have a beta access code, enter it below to unlock the full report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter your beta code"
              value={betaCodeInput}
              onChange={(e) => setBetaCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerifyBetaCode();
                }
              }}
            />
            {betaError && (
              <p className="text-red-500 text-sm">{betaError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBetaDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyBetaCode}>
              Verify Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
    </div>
  );
};

export default ReportDisplay; 