import { KryptoGoButton } from './KryptoGoButton';
import { LemonSqueezyButton } from './LemonSqueezyButton';

interface PaymentButtonsProps {
  reportId?: string;
}

export function PaymentButtons({ reportId }: PaymentButtonsProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <LemonSqueezyButton reportId={reportId} />
      <div className="text-center">
        <KryptoGoButton reportId={reportId} />
      </div>
    </div>
  );
} 