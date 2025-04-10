import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import toast from "react-hot-toast";
import { usePayment } from '../context/PaymentContext';
import { authApi, reportApi } from '../services/apiClient';
import { EnhancedTimelineView } from './EnhancedTimelineView';
import { TimelinePeriod } from './TimelineView';
import { PaymentButtons } from './payment/PaymentButtons';

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
  
  // Add coupon code state
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [hasAppliedCoupon, setHasAppliedCoupon] = useState(false);
  
  // Get payment state from context
  const { isPaid, setIsPaid, initiatePayment, isProcessingPayment } = usePayment();

  // Add state for the confirmation dialog
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);

  const handlePDFDownload = async () => {
    try {
      // First check if user is actually paid
      if (!isPaid) {
        toast.error('You must unlock the full report before downloading the PDF', {
          icon: '🔒',
          duration: 3000
        });
        return;
      }

      // Get the current report ID from localStorage
      const reportId = localStorage.getItem('current_report_id');
      
      if (!reportId) {
        console.error('No report ID found for PDF download');
        toast.error('No report ID found. Please try refreshing the page.', {
          duration: 4000,
          icon: '❌',
        });
        return;
      }
      
      // Verify auth token exists
      if (!localStorage.getItem('auth_token')) {
        toast.error('Authentication required. Please try unlocking the report again.', {
          duration: 4000,
          icon: '🔑',
        });
        return;
      }
      
      // Show loading toast
      const loadingToast = toast.loading('Generating your PDF...', {
        duration: 10000,
      });
      
      try {
        // Call the backend API to generate and download the PDF
        await reportApi.downloadReportPdf(reportId);
        
        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success('Your PDF has been downloaded!', {
          duration: 4000,
          icon: '✅',
        });
      } catch (error: any) {
        // Dismiss loading toast and show error
        toast.dismiss(loadingToast);
        
        // Display more specific error message if available
        if (error.message) {
          toast.error(error.message, {
            duration: 4000,
            icon: '❌',
          });
        } else {
          toast.error('Failed to download PDF. Please try again.', {
            duration: 4000,
            icon: '❌',
          });
        }
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF. Please try again.', {
        duration: 4000,
        icon: '❌',
      });
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

  // Lemon Squeezy button is now handled by the LemonSqueezyButton component
  // Keep this function for backward compatibility with the UI
  const handlePaymentClick = () => {
    // This function is now a no-op as the LemonSqueezyButton handles the payment flow
    console.log('Payment button clicked - using LemonSqueezy component instead');
  };

  const handleVerifyBetaCode = async () => {
    if (!betaCodeInput.trim()) {
      setBetaError('Please enter a beta code');
      return;
    }
    
    // Get the current report ID from localStorage
    const reportId = localStorage.getItem('current_report_id');
    
    try {
      const response = await authApi.verifyBetaCode(betaCodeInput, reportId || undefined);
      
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

  // Handle coupon code verification
  const handleVerifyCouponCode = async () => {
    if (!couponCodeInput.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    try {
      const response = await authApi.verifyCouponCode(couponCodeInput);
      
      if (response.success) {
        // Close the dialog
        setShowCouponDialog(false);
        // Reset the input and error
        setCouponCodeInput('');
        setCouponError(null);
        // Set the coupon as applied and store the discount amount
        setHasAppliedCoupon(true);
        // Store the discounted price in localStorage so KryptoGoButton can use it
        localStorage.setItem('applied_coupon_price', response.discountAmount || '0.01');
        // Show success message
        toast.success('Coupon applied successfully! Your price is now $0.01', {
          duration: 5000,
        });
      } else {
        setCouponError(response.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error verifying coupon code:', error);
      setCouponError('Error verifying code. Please try again.');
    }
  };

  // Handle start over click
  const handleStartOverClick = () => {
    if (isPaid) {
      setShowStartOverDialog(true);
    } else {
      onStartOver();
    }
  };

  // Render the next steps section
  const renderNextSteps = () => {
    // If user is not paid, show the teaser/limited steps
    if (!isPaid) {
      return (
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold text-academic-navy mb-2">Next Steps</h2>
          
          {/* Show tip about partial next steps */}
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-academic-cream/50 border border-academic-gold/30 rounded-md text-sm text-academic-slate">
              <p className="flex items-center">
                <Lock className="h-4 w-4 mr-2 text-academic-gold" />
                <span>This shows partial next actions. Unlock the full report to see all recommended steps.</span>
              </p>
            </div>
            <div className="text-xs text-academic-slate bg-gray-100 px-2 py-1 rounded">
              1 out of {report.nextSteps.length} next actions shown
            </div>
          </div>
          
          {/* Show one next step for free users */}
          {report.nextSteps.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-academic-navy mb-1">
                  1. {report.nextSteps[0].title}
                </h3>
                <p className="text-academic-slate">{report.nextSteps[0].description}</p>
              </div>
            </div>
          )}
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

  // Render the unlock section
  const renderUnlockSection = () => {
    if (!isPaid) {
      // Get the current report ID from localStorage
      const reportId = localStorage.getItem('current_report_id');
      
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
            
            {/* Replace the old button with the LemonSqueezyButton */}
            <div className="min-w-44">
              <PaymentButtons reportId={reportId || undefined} />
              
              {/* Show discount note if coupon applied */}
              {hasAppliedCoupon && (
                <p className="text-xs text-center mt-2 text-academic-slate">
                  Discount applied: <span className="line-through">$19.99</span> $0.01
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
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
        <h2 className="text-xl font-bold text-academic-navy mb-2">Application Timeline</h2>
        
        {!isPaid && (
          <div className="flex justify-between items-center mb-4">
            <div className="p-2 bg-academic-cream/50 border border-academic-gold/30 rounded-md text-sm text-academic-slate">
              <p className="flex items-center">
                <Lock className="h-4 w-4 mr-2 text-academic-gold" />
                <span>This is a partial timeline. Unlock the full report to see all recommended steps.</span>
              </p>
            </div>
            <div className="text-xs text-academic-slate bg-gray-100 px-2 py-1 rounded">
              {getLimitedTimelineData()?.length || 0} out of {report.timeline.length} sections shown
            </div>
          </div>
        )}
        
        <EnhancedTimelineView timelineData={getLimitedTimelineData() || []} />
      </div>
      
      {/* Next Steps Section */}
      {renderNextSteps()}
      
      {/* Unlock Section */}
      {renderUnlockSection()}
      
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
      
      {/* Coupon Code Dialog */}
      <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Coupon Code</DialogTitle>
            <DialogDescription>
              If you have a coupon code, enter it below to apply a discount for crypto payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter your coupon code"
              value={couponCodeInput}
              onChange={(e) => setCouponCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerifyCouponCode();
                }
              }}
            />
            {couponError && (
              <p className="text-red-500 text-sm">{couponError}</p>
            )}
            {hasAppliedCoupon && (
              <p className="text-green-600 text-sm">Coupon applied! Your price is now $0.01</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCouponDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyCouponCode}>
              Apply Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Start Over Confirmation Dialog */}
      <AlertDialog open={showStartOverDialog} onOpenChange={setShowStartOverDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Over?</AlertDialogTitle>
            <AlertDialogDescription>
              Please make sure to save or download your report before starting over. To keep your data private, your report will not be stored on our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onStartOver}>Start Over</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="flex justify-between mt-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleStartOverClick}
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
          
          {/* Coupon code button - shown for unpaid users */}
          {!isPaid && (
            <Button
              variant="outline"
              onClick={() => setShowCouponDialog(true)}
              className="flex items-center gap-2 border-academic-burgundy text-academic-burgundy"
            >
              <span className="text-xs font-bold">%</span>
              Coupon
            </Button>
          )}
        </div>
        
        {/* Only show download button for paid users */}
        {isPaid ? (
          <Button 
            onClick={handlePDFDownload}
            className="flex items-center gap-2"
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Plan (PDF)
              </>
            )}
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={() => toast.error('You must unlock the full report before downloading the PDF.', {
              icon: '🔒',
              duration: 3000
            })}
            className="flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Download Plan (PDF)
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReportDisplay; 