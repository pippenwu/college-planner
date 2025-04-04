import { usePayment as useKryptogoPayment } from '@kryptogo/kryptogokit-sdk-react';

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