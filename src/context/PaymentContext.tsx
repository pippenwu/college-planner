import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import PaymentModal from '../components/payment/PaymentModal';
import { useRealPayment } from '../hooks/usePayment';

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
  // State for payment status with initial value always false
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Use the complete KryptoGO hook
  const {
    openPaymentModal,
    closePaymentModal,
    data,
    txHash,
    error,
    isLoading,
    isSuccess,
    isError,
    isModalOpen,
    resetPayment
  } = useRealPayment();

  const [paymentAmount, setPaymentAmount] = useState('0.01');
  const [paymentCurrency, setPaymentCurrency] = useState<'TWD' | 'USD'>('USD');

  // Check for successful payment - completely in-memory, no persistence
  useEffect(() => {
    console.log('Payment status effect: data=', data, 'txHash=', txHash);
    if (data && data.status === 'success' && txHash) {
      console.log('Payment data:', data);
      setIsPaid(true);
      // No persistence - will be lost on refresh
    }
  }, [data, txHash]);

  // Function to reset payment state manually
  const resetPaymentState = () => {
    setIsPaid(false);
    console.log("Payment state has been manually reset");
  };

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
      isProcessingPayment: isLoading || isVerifying,
      resetPaymentState
    }}>
      {children}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isLoading={isLoading}
        isSuccess={isSuccess}
        isError={!!error}
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