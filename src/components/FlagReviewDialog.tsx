import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Flag, AlertCircle } from 'lucide-react';

interface FlagReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suspectName: string;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

const FlagReviewDialog = ({ open, onOpenChange, suspectName, onConfirm, isLoading }: FlagReviewDialogProps) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for flagging');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason('');
      setError('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Flag for Review
          </DialogTitle>
          <DialogDescription>
            Flag <span className="font-semibold text-foreground">{suspectName}</span> for team review. This will notify all team members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reason for Review <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Describe why this suspect needs team review..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              className={`resize-none ${error ? 'border-destructive' : ''}`}
              rows={4}
            />
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Flagged suspects will appear in the review queue and team members will receive a notification.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading} 
            variant="destructive"
          >
            {isLoading ? 'Flagging...' : 'Flag for Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlagReviewDialog;
