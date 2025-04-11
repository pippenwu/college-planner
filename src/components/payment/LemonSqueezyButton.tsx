import { Key } from 'lucide-react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { usePayment } from '../../context/PaymentContext';

interface LemonSqueezyButtonProps {
  reportId?: string;
}

// Helper function to deeply inspect the Lemon Squeezy data structure
function inspectObject(obj: any, prefix = '') {
  if (!obj) return {};
  
  const result: Record<string, any> = {};
  
  // Recursively traverse the object to find all values
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    
    // Add this path and value
    result[path] = value;
    
    // If this is an object, inspect it too
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = inspectObject(value, path);
      Object.assign(result, nested);
    }
  });
  
  return result;
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
          console.log('Checkout data structure:', JSON.stringify(data, null, 2));
          
          // Deeply inspect the data structure to find the order ID
          const inspected = inspectObject(data);
          console.log('All paths in Lemon Squeezy data:', inspected);
          
          // Find all paths that might contain order IDs
          const orderIdPaths = Object.keys(inspected).filter(path => 
            path.toLowerCase().includes('id') || 
            path.toLowerCase().includes('order')
          );
          
          console.log('Potential order ID paths:', orderIdPaths);
          
          // Log the values of these paths
          const orderIdValues = orderIdPaths.reduce((acc, path) => {
            acc[path] = inspected[path];
            return acc;
          }, {} as Record<string, any>);
          
          console.log('Potential order ID values:', orderIdValues);
          
          // Extract order ID from potential locations
          // Instead of relying on a single path, try multiple possible locations
          let orderId = null;
          
          // Use type assertion to access potentially undefined properties
          const anyData = data as any;
          
          // Try to extract order_id from common locations
          if (anyData.data?.id) orderId = anyData.data.id;
          else if (anyData.data?.order_id) orderId = anyData.data.order_id;
          else if (anyData.data?.attributes?.order_id) orderId = anyData.data.attributes.order_id;
          else if (anyData.attributes?.order_id) orderId = anyData.attributes.order_id;
          else if (anyData.order_id) orderId = anyData.order_id;
          else if (anyData.id) orderId = anyData.id;
          
          // As a last resort, create a dummy order ID using timestamp
          if (!orderId) {
            console.warn('Could not find order ID in data, generating a random one');
            orderId = `lsqy_order_${Date.now()}`;
          }
          
          console.log('Using order ID:', orderId);
          
          // Verify that we have a report ID in localStorage
          const storedReportId = localStorage.getItem('current_report_id');
          if (!storedReportId) {
            console.error('Missing report ID in localStorage');
            toast.error('Payment verification failed: Report ID not found', {
              duration: 5000,
              icon: '❌',
            });
            return;
          }
          
          try {
            // Create a simplified data structure to pass to verification
            const verificationData = {
              data: {
                id: orderId
              }
            };
            
            // Verify the payment using the context function with our normalized data
            await verifyLemonSqueezyPayment(verificationData);
            
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
      
      console.log('Opening checkout with report ID:', currentReportId);
      console.log('Report ID from props:', reportId);
      console.log('Report ID from localStorage:', localStorage.getItem('current_report_id'));
      
      if (!currentReportId) {
        toast.error('No report found. Please try again.', {
          duration: 3000,
          icon: '❌',
        });
        return;
      }
      
      // Store the current report ID to ensure it's available during verification
      localStorage.setItem('current_report_id', currentReportId);
      
      // Build checkout URL with only essential parameters
      const checkoutUrl = `https://dweam.lemonsqueezy.com/buy/bbee9910-43a7-488b-b1de-28323fbc0c75?embed=1&logo=0&discount=0&checkout[custom][reportId]=${encodeURIComponent(currentReportId)}`;
      
      console.log('Checkout URL:', checkoutUrl);
      
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