import { useEffect, useState } from 'react';
import { KryptoGoButton } from './KryptoGoButton';
import { LemonSqueezyButton } from './LemonSqueezyButton';

interface PaymentButtonsProps {
  reportId?: string;
}

export function PaymentButtons({ reportId }: PaymentButtonsProps) {
  const [hasCoupon, setHasCoupon] = useState(false);
  const [discountPrice, setDiscountPrice] = useState('0.01');
  
  // Check for applied coupon
  useEffect(() => {
    const checkCoupon = () => {
      const appliedCouponPrice = localStorage.getItem('applied_coupon_price');
      if (appliedCouponPrice) {
        setHasCoupon(true);
        setDiscountPrice(appliedCouponPrice);
      } else {
        setHasCoupon(false);
      }
    };
    
    // Check immediately
    checkCoupon();
    
    // Also set up a listener for localStorage changes
    window.addEventListener('storage', checkCoupon);
    
    return () => {
      window.removeEventListener('storage', checkCoupon);
    };
  }, []);
  
  return (
    <div className="flex flex-col gap-3 w-full">
      <LemonSqueezyButton reportId={reportId} />
      <div className="text-center">
        <KryptoGoButton reportId={reportId} amount={hasCoupon ? discountPrice : '0.01'} />
      </div>
      
      {/* Show discount note if coupon applied */}
      {hasCoupon && (
        <p className="text-xs text-center mt-2 text-academic-slate">
          Discount applied: <span className="line-through">$19.99</span> ${discountPrice}
        </p>
      )}
      {!hasCoupon && (
        <p className="text-xs text-center mt-2 text-academic-slate">
          Testing price: <span className="line-through">$19.99</span> $0.01
        </p>
      )}
    </div>
  );
} 