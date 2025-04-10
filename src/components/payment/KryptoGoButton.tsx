import { usePayment } from '../../context/PaymentContext';

interface KryptoGoButtonProps {
  reportId?: string;
  amount?: string;
  currency?: 'TWD' | 'USD';
}

export function KryptoGoButton({ 
  reportId, 
  amount = '19.99', 
  currency = 'USD' 
}: KryptoGoButtonProps) {
  const { initiatePayment, isProcessingPayment } = usePayment();
  
  const handleOpenPayment = () => {
    // Store report ID if provided
    if (reportId) {
      localStorage.setItem('current_report_id', reportId);
    }
    
    // Open the KryptoGo payment modal
    initiatePayment(amount, currency);
  };

  return (
    <button 
      onClick={handleOpenPayment}
      disabled={isProcessingPayment}
      className="text-sm text-academic-slate/90 hover:text-academic-navy underline decoration-dotted transition-colors duration-200 inline-flex items-center gap-1"
    >
      <span>or pay with crypto</span>
    </button>
  );
} 