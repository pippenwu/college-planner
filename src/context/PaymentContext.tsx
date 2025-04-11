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
  verifyPaymentStatus: () => Promise<boolean>;
  paidReportId: string | null;
  verifyLemonSqueezyPayment: (checkoutData: any) => Promise<void>;
}

// Create the context with a default value
const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// Provider component
export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for payment status - ALWAYS starts as false, never persisted
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [paidReportId, setPaidReportId] = useState<string | null>(null);
  
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
      if (data && data.status === 'success' && txHash && currentPaymentId) {
        try {
          setIsVerifying(true);
          
          // Call our backend API to verify the payment
          const response = await paymentApi.verifyPayment(currentPaymentId, txHash);
          
          if (response.success && response.token) {
            // Payment was verified successfully
            setIsPaid(true);
            
            // Save the report ID that was paid for
            if (response.reportId) {
              setPaidReportId(response.reportId);
            }
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
    setPaidReportId(null);
    // Clear any applied coupon
    localStorage.removeItem('applied_coupon_price');
  };

  // This effect ensures payment verification happens on component mount
  useEffect(() => {
    // Check payment status using server-side verification
    const checkPaymentStatus = async () => {
      try {
        // Only proceed if we have a token
        if (localStorage.getItem('auth_token')) {
          setIsVerifying(true);
          // Use our verification endpoint
          const response = await paymentApi.verifyPaymentStatus();
          
          if (response.success && response.isPaid) {
            setIsPaid(true);
            // Store the report ID that was paid for
            if (response.tokenReportId) {
              setPaidReportId(response.tokenReportId);
            }
          } else {
            setIsPaid(false);
            // If we have a token but the verification failed, it might be for a different report
            if (response.tokenReportId && response.currentReportId && response.tokenReportId !== response.currentReportId) {
              console.warn(`Token is for a different report: paid for ${response.tokenReportId} but viewing ${response.currentReportId}`);
              setPaidReportId(response.tokenReportId);
            }
          }
        } else {
          // No token means not paid
          setIsPaid(false);
        }
      } catch (error) {
        console.error('Payment status verification error:', error);
        setIsPaid(false);
      } finally {
        setIsVerifying(false);
      }
    };
    
    checkPaymentStatus();
    
    return () => {
      // Clear any applied coupon when unmounting
      localStorage.removeItem('applied_coupon_price');
    };
  }, []);

  // Function to verify payment status on demand (for components to call)
  const verifyPaymentStatus = async (): Promise<boolean> => {
    try {
      setIsVerifying(true);
      
      // Only proceed if we have a token
      if (!localStorage.getItem('auth_token')) {
        setIsPaid(false);
        return false;
      }
      
      // Use our verification endpoint
      const response = await paymentApi.verifyPaymentStatus();
      
      if (response.success && response.isPaid) {
        setIsPaid(true);
        // Store the report ID that was paid for
        if (response.tokenReportId) {
          setPaidReportId(response.tokenReportId);
        }
        return true;
      } else {
        setIsPaid(false);
        // If we have a token but the verification failed, it might be for a different report
        if (response.tokenReportId && response.currentReportId && response.tokenReportId !== response.currentReportId) {
          console.warn(`Token is for a different report: paid for ${response.tokenReportId} but viewing ${response.currentReportId}`);
          setPaidReportId(response.tokenReportId);
        }
        return false;
      }
    } catch (error) {
      console.error('On-demand payment verification error:', error);
      setIsPaid(false);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

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

  // Function to handle Lemon Squeezy payment verification
  const verifyLemonSqueezyPayment = async (checkoutData: any) => {
    try {
      if (!checkoutData || !checkoutData.data) return;
      
      const orderData = checkoutData.data;
      const currentReportId = localStorage.getItem('current_report_id');
      
      // Call an API endpoint to validate the payment
      const response = await fetch('/api/lemon-squeezy/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: orderData.id,
          reportId: currentReportId
        })
      });
      
      // Get the token from the server
      const { token } = await response.json();
      
      // Store the token and verify payment status
      if (token) {
        localStorage.setItem('auth_token', token);
        await verifyPaymentStatus();
      }
    } catch (error) {
      console.error('Lemon Squeezy verification error:', error);
    }
  };

  return (
    <PaymentContext.Provider value={{ 
      isPaid, 
      setIsPaid,
      initiatePayment,
      isProcessingPayment: isLoading || isVerifying,
      resetPaymentState,
      verifyPaymentStatus,
      paidReportId,
      verifyLemonSqueezyPayment
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