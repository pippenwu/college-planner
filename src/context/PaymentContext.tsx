import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useRealPayment } from '../hooks/usePayment';
import { paymentApi } from '../services/apiClient';

// Define the context type
interface PaymentContextType {
  isPaid: boolean;
  setIsPaid: React.Dispatch<React.SetStateAction<boolean>>;
  initiatePayment: (amount: string, currency: 'TWD' | 'USD') => void;
  isProcessingPayment: boolean;
  resetPaymentState: () => void;
}

// Create the context with a default value
const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// Provider component
export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for payment status - ALWAYS starts as false, never persisted
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  
  // Use the KryptoGO hook
  const {
    openPaymentModal,
    data,
    txHash,
    isLoading
  } = useRealPayment();

  // Check for successful payment and verify with backend
  useEffect(() => {
    const verifyPayment = async () => {
      console.log('Payment status effect: data=', data, 'txHash=', txHash);
      if (data && data.status === 'success' && txHash && currentPaymentId) {
        try {
          setIsVerifying(true);
          console.log('Verifying payment with backend...');
          
          // Call our backend API to verify the payment
          const response = await paymentApi.verifyPayment(currentPaymentId, txHash);
          
          if (response.success && response.token) {
            console.log('Payment verified successfully:', response);
            // Payment was verified successfully
            setIsPaid(true);
          } else {
            console.error('Payment verification failed:', response);
          }
        } catch (error) {
          console.error('Payment verification error:', error);
        } finally {
          setIsVerifying(false);
        }
      }
    };
    
    verifyPayment();
  }, [data, txHash, currentPaymentId]);

  // Function to reset payment state manually
  const resetPaymentState = () => {
    setIsPaid(false);
    setCurrentPaymentId(null);
    console.log("Payment state has been manually reset");
  };

  // This effect ensures isPaid state is reset whenever the component remounts
  // (which happens when navigating between reports)
  useEffect(() => {
    console.log("PaymentProvider mounted - payment state reset");
    setIsPaid(false);
    
    // Check if we have a token in localStorage
    const validateToken = async () => {
      try {
        if (localStorage.getItem('auth_token')) {
          // Attempt to validate the token
          const response = await fetch('/api/auth/validate-token', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.isPaid) {
              console.log('Valid payment token found:', data);
              setIsPaid(true);
            }
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }
    };
    
    validateToken();
    
    return () => {
      console.log("PaymentProvider unmounting");
    };
  }, []);

  const initiatePayment = async (amount: string, currency: 'TWD' | 'USD') => {
    try {
      // Get the current report ID from localStorage
      const reportId = localStorage.getItem('current_report_id') || `report_${Date.now()}`;
      
      console.log('Initializing payment for report:', reportId);
      
      // Initialize payment with our backend
      const response = await paymentApi.initializePayment(amount, currency, reportId);
      
      if (response.success && response.data) {
        // Store the payment ID for later verification
        setCurrentPaymentId(response.data.paymentId);
        
        // Open the KryptoGO payment modal
        openPaymentModal({
          fiat_amount: amount,
          fiat_currency: currency,
          order_data: {
            order_product_id: 'college-report-full',
            order_product_name: 'College Application Planner Full Report',
            payment_id: response.data.paymentId,
            report_id: reportId
          }
        });
      } else {
        console.error('Payment initialization failed:', response);
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
    }
  };

  return (
    <PaymentContext.Provider value={{ 
      isPaid, 
      setIsPaid,
      initiatePayment,
      isProcessingPayment: isLoading || isVerifying,
      resetPaymentState
    }}>
      {children}
    </PaymentContext.Provider>
  );
};

// Custom hook to use the payment context
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export default PaymentContext; 