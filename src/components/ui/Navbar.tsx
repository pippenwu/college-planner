import { usePayment } from '@/context/PaymentContext';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './alert-dialog';

interface NavbarProps {
  className?: string;
}

export function Navbar({ className = '' }: NavbarProps) {
  const { isPaid } = usePayment();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleLogoClick = () => {
    if (isPaid) {
      setShowConfirmDialog(true);
    } else {
      window.location.href = '/';
    }
  };

  return (
    <>
      <nav className={`z-50 mt-4 ${className}`}>
        <div className="max-w-6xl ml-2 px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            >
              <img src="/cat-icon.png" alt="CAT Logo" className="w-12 h-12" />
            </div>
          </div>
        </div>
      </nav>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
            <AlertDialogDescription>
              Please make sure to save or download your report before leaving. We do not store any private information on our servers, so you won't be able to access this report again once you leave.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => window.location.href = '/'}>
              Yes, I understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 