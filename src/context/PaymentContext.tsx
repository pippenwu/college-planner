import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import PaymentModal from '../components/payment/PaymentModal';
import usePaymentMock from '../hooks/usePaymentMock';

// Backend API URL
const API_URL = 'http://localhost:4000';

// Define the context type
interface PaymentContextType {
  isPaid: boolean;
  setIsPaid: React.Dispatch<React.SetStateAction<boolean>>;
  initiatePayment: (amount: string, currency: 'TWD' | 'USD') => void;
  isProcessingPayment: boolean;
}

// Create the context with a default value
const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// Storage key for access token
const ACCESS_TOKEN_KEY = 'college_planner_access_token';

// Provider component
export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPaid, setIsPaid] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  
  const {
    openPaymentModal,
    closePaymentModal,
    isLoading,
    isSuccess,
    isError,
    error,
    isModalOpen,
    resetPayment,
    txHash,
    data
  } = usePaymentMock();

  const [paymentAmount, setPaymentAmount] = useState('0.01');
  const [paymentCurrency, setPaymentCurrency] = useState<'TWD' | 'USD'>('USD');

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        
        if (!token) {
          setIsVerifying(false);
          return;
        }
        
        // For mock implementation: Set isPaid based on token existence
        console.log('Mock token found - user has paid');
        setIsPaid(true);
        setIsVerifying(false);
        
        /* Comment out actual backend verification for now
        // Validate token with backend
        const response = await fetch(`${API_URL}/api/validate-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        
        const data = await response.json();
        
        if (data.success && data.valid) {
          console.log('Token valid - user has paid');
          setIsPaid(true);
        } else {
          // Clear invalid token
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          setIsPaid(false);
        }
        */
      } catch (err) {
        console.error('Error verifying token:', err);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        setIsPaid(false);
        setIsVerifying(false);
      }
    };
    
    verifyToken();
  }, []);

  // Check for payment success and verify with backend
  useEffect(() => {
    const verifyPayment = async () => {
      if (isSuccess && txHash) {
        try {
          console.log('Payment successful - verifying with backend', txHash);
          
          // For mock implementation: Set isPaid directly without backend
          setIsPaid(true);
          console.log('Mock payment verified - full report unlocked');
          
          /* Comment out actual backend verification for now
          // Verify payment with backend
          const response = await fetch(`${API_URL}/api/verify-access`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ txHash }),
          });
          
          const result = await response.json();
          
          if (result.success && result.token) {
            // Store the JWT token
            localStorage.setItem(ACCESS_TOKEN_KEY, result.token);
            setIsPaid(true);
            console.log('Payment verified - full report unlocked');
          } else {
            console.error('Payment verification failed:', result);
          }
          */
        } catch (err) {
          console.error('Error verifying payment with backend:', err);
        }
      }
    };
    
    verifyPayment();
  }, [isSuccess, txHash]);

  const initiatePayment = (amount: string, currency: 'TWD' | 'USD') => {
    setPaymentAmount(amount);
    setPaymentCurrency(currency);
    
    // Generate a unique payment ID for this transaction
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    openPaymentModal({
      fiat_amount: amount,
      fiat_currency: currency,
      callback_url: `${API_URL}/api/payment/callback`,
      order_data: {
        order_product_id: 'college-report-full',
        order_product_name: 'College Application Planner Full Report',
        payment_id: paymentId
      }
    });
  };

  // Handle payment modal close
  const handleCloseModal = () => {
    if (isSuccess) {
      // If payment was successful, just reset the payment state
      resetPayment();
    } else {
      // If payment was not successful, close the modal
      closePaymentModal();
    }
  };

  return (
    <PaymentContext.Provider value={{ 
      isPaid, 
      setIsPaid,
      initiatePayment,
      isProcessingPayment: isLoading || isVerifying
    }}>
      {children}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isLoading={isLoading}
        isSuccess={isSuccess}
        isError={isError}
        error={error}
        amount={paymentAmount}
        currency={paymentCurrency}
      />
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