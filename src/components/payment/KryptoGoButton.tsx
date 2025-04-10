import { useEffect, useState } from 'react';
import { usePayment } from '../../context/PaymentContext';

interface KryptoGoButtonProps {
  reportId?: string;
  amount?: string;
  currency?: 'TWD' | 'USD';
}

export function KryptoGoButton({ 
  reportId, 
  amount = '0.01', 
  currency = 'USD' 
}: KryptoGoButtonProps) {
  const { initiatePayment, isProcessingPayment } = usePayment();
  const [paymentAmount, setPaymentAmount] = useState(amount);
  
  // Check for applied coupon on mount and when localStorage changes
  useEffect(() => {
    const appliedCouponPrice = localStorage.getItem('applied_coupon_price');
    if (appliedCouponPrice) {
      setPaymentAmount(appliedCouponPrice);
    } else {
      setPaymentAmount(amount);
    }
  }, [amount]);
  
  const handleOpenPayment = () => {
    // Store report ID if provided
    if (reportId) {
      localStorage.setItem('current_report_id', reportId);
    }
    
    // Open the KryptoGo payment modal with the (potentially discounted) amount
    initiatePayment(paymentAmount, currency);
  };

  return (
    <button 
      onClick={handleOpenPayment}
      disabled={isProcessingPayment}
      className="text-sm text-academic-slate/90 hover:text-academic-navy underline decoration-dotted transition-colors duration-200 inline-flex items-center gap-1"
    >
      <span>or pay with crypto{paymentAmount !== amount ? ` ($${paymentAmount})` : ''}</span>
    </button>
  );
} 