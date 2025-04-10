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

  // Clear payment-related storage on component mount
  useEffect(() => {
    try {
      console.log("Clearing payment-related storage");
      
      // Clear payment-related localStorage items
      try {
        const paymentKeys = Object.keys(localStorage).filter(
          key => key.includes('payment') || key.includes('kryptogo')
        );
        paymentKeys.forEach(key => localStorage.removeItem(key));
      } catch (err) {
        console.warn('Error clearing localStorage:', err);
      }
      
      // Clear payment-related sessionStorage items
      try {
        const paymentKeys = Object.keys(sessionStorage).filter(
          key => key.includes('payment') || key.includes('kryptogo')
        );
        paymentKeys.forEach(key => sessionStorage.removeItem(key));
      } catch (err) {
        console.warn('Error clearing sessionStorage:', err);
      }
      
      console.log("Payment storage items cleared");
    } catch (e) {
      console.error('Error in storage clearing effect:', e);
    }
  }, []);

  // Create a wrapper around the KryptoGO openPaymentModal to ensure it accepts our interface
  const openPaymentModal = (params: PaymentParams) => {
    console.log('Opening KryptoGO payment modal with params:', params);
    // First cleanup any potential DOM issues
    document.querySelectorAll('[data-kryptogo-modal]').forEach(el => {
      el.remove();
    });
    // Then open the modal
    kryptogoOpenPaymentModal(params);
  };

  // Enhanced close modal function to clean up any visual artifacts
  const enhancedCloseModal = () => {
    closePaymentModal();
    // Clean up any layout issues after closing
    setTimeout(() => {
      document.querySelectorAll('[data-kryptogo-modal]').forEach(el => {
        el.remove();
      });
      // Remove any body classes that might have been added
      document.body.classList.remove('kryptogo-open');
      // Reset any overflow styles
      document.body.style.overflow = '';
    }, 100);
  };

  // For compatibility with our existing interface
  const isModalOpen = false;
  const resetPayment = enhancedCloseModal;

  return {
    openPaymentModal,
    closePaymentModal: enhancedCloseModal,
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