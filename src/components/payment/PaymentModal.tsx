import { Check, Clock, Loader2, RefreshCw, X } from 'lucide-react';
import React, { useEffect } from 'react';
import { Button } from '../ui/button';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: Error;
  amount: string;
  currency: string;
  data?: any;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  isSuccess,
  isError,
  error,
  amount,
  currency,
  data
}) => {
  // Add effect to log render state for debugging
  useEffect(() => {
    console.log('PaymentModal render state:', { isOpen, isLoading, isSuccess, isError });
    if (data) {
      console.log('Payment data:', data);
    }
  }, [isOpen, isLoading, isSuccess, isError, data]);

  // Early return if not open
  if (!isOpen) return null;

  // Function to determine payment status message
  const getStatusContent = () => {
    if (!data || !data.status) {
      return null;
    }

    switch (data.status) {
      case 'success':
        return (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Check className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h4 className="text-lg font-medium text-green-700">Payment Successful!</h4>
            <p className="text-gray-600">Thank you for your purchase. Your full report is now available.</p>
            <Button 
              onClick={onClose}
              className="bg-academic-burgundy hover:bg-academic-navy text-white"
            >
              View Full Report
            </Button>
          </div>
        );
      case 'pending':
        return (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <Clock className="h-12 w-12 text-academic-burgundy animate-pulse" />
            </div>
            <p className="text-gray-600">Waiting for your payment of {amount} {currency}...</p>
            <p className="text-xs text-gray-500">Please complete the payment within the time limit</p>
          </div>
        );
      case 'expired':
        return (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
            </div>
            <h4 className="text-lg font-medium text-amber-700">Payment Window Expired</h4>
            <p className="text-gray-600">The payment window has closed without receiving funds.</p>
            <Button 
              onClick={onClose}
              className="bg-academic-burgundy hover:bg-academic-navy text-white"
            >
              Try Again
            </Button>
          </div>
        );
      case 'insufficient_not_refunded':
        return (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <RefreshCw className="h-10 w-10 text-orange-600" />
              </div>
            </div>
            <h4 className="text-lg font-medium text-orange-700">Insufficient Payment</h4>
            <p className="text-gray-600">The payment amount was too low. A refund is pending.</p>
            <Button 
              onClick={onClose}
              className="bg-academic-burgundy hover:bg-academic-navy text-white"
            >
              Close
            </Button>
          </div>
        );
      case 'insufficient_refunded':
        return (
          <div className="space-y-4 py-6">
            <div className="flex justify-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Check className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <h4 className="text-lg font-medium text-blue-700">Payment Refunded</h4>
            <p className="text-gray-600">Insufficient payment has been refunded to your wallet.</p>
            <Button 
              onClick={onClose}
              className="bg-academic-burgundy hover:bg-academic-navy text-white"
            >
              Try Again
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          disabled={isLoading}
          type="button"
        >
          <X size={20} />
        </button>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold text-academic-navy mb-4">Complete Your Payment</h3>
          
          {isLoading && !statusContent && (
            <div className="space-y-4 py-6">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-academic-burgundy animate-spin" />
              </div>
              <p className="text-gray-600">Processing your payment of {amount} {currency}...</p>
              <p className="text-xs text-gray-500">Please do not close this window</p>
            </div>
          )}
          
          {statusContent}
          
          {isError && !statusContent && (
            <div className="space-y-4 py-6">
              <div className="flex justify-center">
                <div className="bg-red-100 p-3 rounded-full">
                  <X className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <h4 className="text-lg font-medium text-red-700">Payment Failed</h4>
              <p className="text-gray-600">{error?.message || 'An unexpected error occurred.'}</p>
              <Button 
                onClick={onClose}
                className="bg-academic-burgundy hover:bg-academic-navy text-white"
              >
                Try Again
              </Button>
            </div>
          )}
          
          {!isLoading && !isSuccess && !isError && !statusContent && (
            <div className="space-y-6 py-4">
              <div className="bg-academic-cream/50 p-4 rounded-lg">
                <p className="text-lg font-semibold text-academic-navy">{amount} {currency}</p>
                <p className="text-sm text-gray-600">Unlocks your full premium report</p>
              </div>
              
              <div className="text-center text-gray-600 py-3">
                <p>The payment process is managed securely by KryptoGO.</p>
                <p className="text-sm mt-2">Follow the prompts to complete your payment.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 