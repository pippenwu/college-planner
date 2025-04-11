import { Key } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { usePayment } from '../../context/PaymentContext';

interface LemonSqueezyButtonProps {
  reportId?: string;
}

export function LemonSqueezyButton({ reportId }: LemonSqueezyButtonProps) {
  const { verifyLemonSqueezyPayment } = usePayment();

  // Initialize Lemon Squeezy SDK
  useEffect(() => {
    // Make sure we're in the browser and Lemon Squeezy SDK is available
    if (typeof window === 'undefined' || !window.LemonSqueezy) {
      return;
    }

    // Configure the SDK
    window.LemonSqueezy.Setup({
      eventHandler: async (data) => {
        console.log('Lemon Squeezy event:', data);
        
        // Handle successful checkout
        if (data.event === 'Checkout.Success') {
          console.log('Payment successful!');
          
          try {
            // Verify the payment using the context function
            await verifyLemonSqueezyPayment(data);
            
            // Close the checkout overlay programmatically
            if (window.LemonSqueezy && window.LemonSqueezy.Url) {
              window.LemonSqueezy.Url.Close();
            }
            
            // Show success message after closing the overlay
            setTimeout(() => {
              toast.success('Payment successful! Your full report is now available', {
                duration: 5000,
                icon: '✅',
              });
            }, 500);
          } catch (error) {
            console.error('Error verifying payment:', error);
            toast.error('Error processing payment. Please try again.', {
              duration: 5000,
              icon: '❌',
            });
          }
        }
      }
    });

    return () => {
      // No cleanup needed
    };
  }, [verifyLemonSqueezyPayment, reportId]);

  const handleOpenCheckout = () => {
    // Check if Lemon Squeezy SDK is available
    if (typeof window !== 'undefined' && window.LemonSqueezy) {
      // Get the current report ID if not provided
      const currentReportId = reportId || localStorage.getItem('current_report_id');
      
      if (!currentReportId) {
        toast.error('No report found. Please try again.', {
          duration: 3000,
          icon: '❌',
        });
        return;
      }
      
      // Build checkout URL with only essential parameters
      const checkoutUrl = `https://dweam.lemonsqueezy.com/buy/bbee9910-43a7-488b-b1de-28323fbc0c75?embed=1&logo=0&discount=0&checkout[custom][reportId]=${encodeURIComponent(currentReportId)}`;
      
      // Open the checkout using the SDK
      window.LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      toast.error('Payment system is not available. Please try again later.', {
        duration: 3000,
        icon: '❌',
      });
    }
  };

  return (
    <button 
      onClick={handleOpenCheckout}
      className="px-4 py-2 bg-academic-burgundy text-white rounded-lg hover:bg-academic-navy transition-colors duration-200 flex items-center gap-2"
    >
      <span>Unlock Full Report ($19.99)</span>
      <Key className="h-4 w-4" />
    </button>
  );
} 