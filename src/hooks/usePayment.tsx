import { usePayment as useKryptogoPayment } from '@kryptogo/kryptogokit-sdk-react';
import { useEffect } from 'react';

// This file will use the actual KryptoGO implementation when the packages are installed
// For now, we're using a typed interface that matches KryptoGO's but with a mock implementation

// This should be replaced with:
// import { usePayment as useKryptogoPayment } from '@kryptogo/kryptogokit-sdk-react';

export interface PaymentData {
  payment_intent_id: string;
  payment_chain_id: string;
  payment_address: string;
  token_address: string;
  symbol: string;
  decimals: number;
  crypto_amount: string;
  fiat_amount: string;
  fiat_currency: 'TWD' | 'USD';
  payment_deadline: number;
  status: 'CREATED' | 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
  payment_tx_hash: string | null;
  callback_url: string | null;
  order_data: Record<string, any> | null;
}

export interface PaymentParams {
  fiat_amount: string;
  fiat_currency: 'TWD' | 'USD';
  callback_url?: string;
  order_data?: Record<string, any>;
}

// Real implementation using KryptoGO
export const useRealPayment = () => {
  const {
    openPaymentModal: kryptogoOpenPaymentModal,
    closePaymentModal,
    data,
    txHash,
    error,
    isLoading,
    isSuccess,
    isError
  } = useKryptogoPayment();

  // Clear ALL storage on component mount to prevent any persistence
  useEffect(() => {
    try {
      console.log("Clearing all storage to prevent persistence");
      
      // Safer way to clear localStorage without causing errors
      try {
        // Only clear payment-related items instead of everything
        const paymentKeys = Object.keys(localStorage).filter(
          key => key.includes('payment') || key.includes('kryptogo')
        );
        paymentKeys.forEach(key => localStorage.removeItem(key));
      } catch (err) {
        console.warn('Error clearing localStorage:', err);
      }
      
      // Safer way to clear sessionStorage without causing errors
      try {
        // Only clear payment-related items instead of everything
        const paymentKeys = Object.keys(sessionStorage).filter(
          key => key.includes('payment') || key.includes('kryptogo')
        );
        paymentKeys.forEach(key => sessionStorage.removeItem(key));
      } catch (err) {
        console.warn('Error clearing sessionStorage:', err);
      }
      
      // Don't attempt to clear all cookies, just payment ones if needed
      
      console.log("Payment storage items cleared");
    } catch (e) {
      console.error('Error in storage clearing effect:', e);
    }
  }, []);

  // Create a wrapper around the KryptoGO openPaymentModal to ensure it accepts our interface
  const openPaymentModal = (params: PaymentParams) => {
    console.log('Opening KryptoGO payment modal with params:', params);
    kryptogoOpenPaymentModal(params);
  };

  // For compatibility with our existing interface, maintain isModalOpen and resetPayment
  const isModalOpen = isLoading || isSuccess || isError;
  const resetPayment = closePaymentModal;

  return {
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
  };
};

export default useRealPayment; 