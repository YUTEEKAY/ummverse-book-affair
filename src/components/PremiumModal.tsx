import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles } from 'lucide-react';

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PremiumModal = ({ open, onOpenChange }: PremiumModalProps) => {
  const handleUnlockAccess = () => {
    window.location.href = 'https://ummverse.lemonsqueezy.com/buy/ummverse-premium';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-dusty-rose/20">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center gap-2">
            <Heart className="w-12 h-12 text-dusty-rose fill-dusty-rose" />
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-serif text-foreground">
            💖 Continue your affair with romance
          </DialogTitle>
          <DialogDescription className="text-base">
            You've reached your free viewing limit for this week. Unlock full access to discover unlimited romance books tailored to your taste.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-r from-blush/20 to-dusty-rose/20 rounded-lg p-4 space-y-2">
            <p className="font-medium text-foreground">✨ Premium Benefits:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>💕 Unlimited book views and recommendations</li>
              <li>💕 Complete book summaries and details</li>
              <li>💕 AI-powered personalized suggestions</li>
              <li>💕 Access to reviews and ratings</li>
            </ul>
          </div>

          <Button
            onClick={handleUnlockAccess}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-dusty-rose hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Unlock Full Access
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Your free views will reset in 7 days
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
