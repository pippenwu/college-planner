import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import PaymentModal from '../components/payment/PaymentModal';
import { useRealPayment } from '../hooks/usePayment';

// Define the context type
interface PaymentContextType {
  isPaid: boolean;
  setIsPaid: React.Dispatch<React.SetStateAction<boolean>>;
  initiatePayment: (amount: string, currency: 'TWD' | 'USD') => void;
  isProcessingPayment: boolean;
}

// Create the context with a default value
const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// Storage key for access token - using localStorage to persist payment state between sessions
const PAYMENT_STATUS_KEY = 'college_planner_payment_status';

// Provider component
export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Check localStorage for any existing payment status
  const [isPaid, setIsPaid] = useState(() => {
    const savedStatus = localStorage.getItem(PAYMENT_STATUS_KEY);
    return savedStatus ? JSON.parse(savedStatus) : false;
  });
  
  const [isVerifying, setIsVerifying] = useState(false);
  
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
  } = useRealPayment();

  const [paymentAmount, setPaymentAmount] = useState('0.01');
  const [paymentCurrency, setPaymentCurrency] = useState<'TWD' | 'USD'>('USD');

  // Update local storage when isPaid changes
  useEffect(() => {
    localStorage.setItem(PAYMENT_STATUS_KEY, JSON.stringify(isPaid));
  }, [isPaid]);

  // Check for payment success from KryptoGO
  useEffect(() => {
    if (data && data.status === 'success' && txHash) {
      console.log('Payment successful with txHash:', txHash);
      console.log('Payment data:', data);
      
      // Set isPaid directly based on KryptoGO's successful transaction
      setIsPaid(true);
      
      // For a production app, you would typically verify this transaction on a backend
      // before granting access, but for this version we'll trust KryptoGO's response
      console.log('Full report unlocked based on successful KryptoGO payment');
    }
  }, [data, txHash]);

  const initiatePayment = (amount: string, currency: 'TWD' | 'USD') => {
    setPaymentAmount(amount);
    setPaymentCurrency(currency);
    
    // Generate a unique payment ID for this transaction
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    openPaymentModal({
      fiat_amount: amount,
      fiat_currency: currency,
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
        data={data}
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