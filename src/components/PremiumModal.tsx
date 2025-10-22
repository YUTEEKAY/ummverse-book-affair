import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Sparkles } from 'lucide-react';
import { PricingTiers } from './PricingTiers';
interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const PremiumModal = ({
  open,
  onOpenChange
}: PremiumModalProps) => {
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl border-dusty-rose/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4 bg-[#e7a7e1]">
          <div className="flex justify-center gap-2">
            <Heart className="w-12 h-12 text-dusty-rose fill-dusty-rose" />
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-serif text-foreground">
            💖 Continue your affair with romance
          </DialogTitle>
          <DialogDescription className="text-base">
            You've reached your free viewing limit for this week. Choose a plan to unlock full access to unlimited romance books.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 bg-[#c597bc]">
          <PricingTiers />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your free views will reset in 7 days
        </p>
      </DialogContent>
    </Dialog>;
};
export default PremiumModal;