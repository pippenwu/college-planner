import { useState } from 'react';

// This is a mock implementation of the usePayment hook
// Replace with actual implementation after installing @kryptogo/kryptogokit-sdk-react
export const usePaymentMock = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [data, setData] = useState<any>(undefined);

  const openPaymentModal = (params: {
    fiat_amount: string;
    fiat_currency: 'TWD' | 'USD';
    callback_url?: string;
    order_data?: Record<string, any>;
  }) => {
    try {
      console.log('Opening payment modal with params:', params);
      setIsModalOpen(true);
      setIsLoading(true);
      setIsError(false);
      setError(undefined);
      
      // Simulate payment processing with a timeout
      setTimeout(() => {
        try {
          // For mock purposes, we'll simulate a successful payment
          setIsLoading(false);
          setIsSuccess(true);
          setTxHash('0x' + Math.random().toString(16).substr(2, 40));
          setData({
            payment_intent_id: 'mock_intent_' + Date.now(),
            payment_chain_id: '1',
            payment_address: '0x' + Math.random().toString(16).substr(2, 40),
            token_address: '0x' + Math.random().toString(16).substr(2, 40),
            symbol: 'ETH',
            decimals: 18,
            crypto_amount: '0.01',
            fiat_amount: params.fiat_amount,
            fiat_currency: params.fiat_currency,
            payment_deadline: Date.now() + 3600000, // 1 hour from now
            status: 'COMPLETED',
            payment_tx_hash: '0x' + Math.random().toString(16).substr(2, 40),
            callback_url: params.callback_url || null,
            order_data: params.order_data || null,
          });
          
          // Close modal after payment is complete
          setTimeout(() => {
            setIsModalOpen(false);
          }, 2000);
        } catch (err) {
          console.error('Error in payment simulation:', err);
          setIsLoading(false);
          setIsError(true);
          setError(new Error('Failed to process payment. Please try again.'));
        }
      }, 3000);
    } catch (err) {
      console.error('Error opening payment modal:', err);
      setIsLoading(false);
      setIsError(true);
      setError(new Error('Failed to open payment modal. Please try again.'));
    }
  };

  const closePaymentModal = () => {
    try {
      console.log('Closing payment modal');
      setIsModalOpen(false);
      if (isLoading) {
        setIsLoading(false);
        setIsError(true);
        setError(new Error('Payment was cancelled'));
      }
    } catch (err) {
      console.error('Error closing payment modal:', err);
    }
  };

  // For demonstration purposes, also add a function to reset payment state
  const resetPayment = () => {
    try {
      console.log('Resetting payment state');
      setIsModalOpen(false);
      setIsLoading(false);
      setIsSuccess(false);
      setIsError(false);
      setError(undefined);
      setTxHash(undefined);
      setData(undefined);
    } catch (err) {
      console.error('Error resetting payment state:', err);
    }
  };

  return {
    openPaymentModal,
    closePaymentModal,
    resetPayment,
    data,
    txHash,
    error,
    isLoading,
    isSuccess,
    isError,
    isModalOpen,
  };
};

export default usePaymentMock; 