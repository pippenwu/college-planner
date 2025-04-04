import { Check, Loader2, X } from 'lucide-react';
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
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  isSuccess,
  isError,
  error,
  amount,
  currency
}) => {
  // Add effect to log render state for debugging
  useEffect(() => {
    console.log('PaymentModal render state:', { isOpen, isLoading, isSuccess, isError });
  }, [isOpen, isLoading, isSuccess, isError]);

  // Early return if not open
  if (!isOpen) return null;

  // Handle button click
  const handleConnectWallet = () => {
    console.log('Connect wallet clicked - in real implementation this would connect the wallet');
    // In the mock version, clicking this button would be the same as starting the payment process
    // The actual process is handled by the parent component already
  };

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
          
          {isLoading && (
            <div className="space-y-4 py-6">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-academic-burgundy animate-spin" />
              </div>
              <p className="text-gray-600">Processing your payment of {amount} {currency}...</p>
              <p className="text-xs text-gray-500">Please do not close this window</p>
            </div>
          )}
          
          {isSuccess && (
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
          )}
          
          {isError && (
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
          
          {!isLoading && !isSuccess && !isError && (
            <div className="space-y-6 py-4">
              <div className="bg-academic-cream/50 p-4 rounded-lg">
                <p className="text-lg font-semibold text-academic-navy">{amount} {currency}</p>
                <p className="text-sm text-gray-600">Unlocks your full premium report</p>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Button
                  className="bg-academic-burgundy hover:bg-academic-navy text-white"
                  onClick={handleConnectWallet}
                >
                  Connect Wallet to Pay
                </Button>
                <p className="text-xs text-gray-500 italic">
                  This is a demonstration. No actual payment will be processed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal; 