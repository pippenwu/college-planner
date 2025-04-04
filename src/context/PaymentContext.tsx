import React, { createContext, ReactNode, useContext, useState } from 'react';
import PaymentModal from '../components/payment/PaymentModal';
import usePaymentMock from '../hooks/usePaymentMock';

// Define the context type
interface PaymentContextType {
  isPaid: boolean;
  setIsPaid: React.Dispatch<React.SetStateAction<boolean>>;
  initiatePayment: (amount: string, currency: 'TWD' | 'USD') => void;
  isProcessingPayment: boolean;
}

// Create the context with a default value
const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// Provider component
export const PaymentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPaid, setIsPaid] = useState(false);
  const {
    openPaymentModal,
    closePaymentModal,
    isLoading,
    isSuccess,
    isError,
    error,
    isModalOpen,
    resetPayment
  } = usePaymentMock();

  const [paymentAmount, setPaymentAmount] = useState('19.99');
  const [paymentCurrency, setPaymentCurrency] = useState<'TWD' | 'USD'>('USD');

  // Check for payment success and update isPaid state
  React.useEffect(() => {
    if (isSuccess) {
      setIsPaid(true);
    }
  }, [isSuccess]);

  const initiatePayment = (amount: string, currency: 'TWD' | 'USD') => {
    setPaymentAmount(amount);
    setPaymentCurrency(currency);
    openPaymentModal({
      fiat_amount: amount,
      fiat_currency: currency,
      order_data: {
        order_product_id: 'college-report-full',
        order_product_name: 'College Application Planner Full Report'
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
      isProcessingPayment: isLoading
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