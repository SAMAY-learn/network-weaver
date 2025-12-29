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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, AlertTriangle, Shield, Activity } from 'lucide-react';
import { WatchlistPriority } from '@/hooks/useWatchlist';

interface WatchlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suspectName: string;
  onConfirm: (priority: WatchlistPriority, notes?: string) => void;
  isLoading?: boolean;
}

const priorityOptions: { value: WatchlistPriority; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'critical', label: 'Critical', icon: <AlertTriangle className="w-4 h-4 text-destructive" />, description: 'Immediate attention required' },
  { value: 'high', label: 'High', icon: <Shield className="w-4 h-4 text-warning" />, description: 'Active monitoring' },
  { value: 'medium', label: 'Medium', icon: <Eye className="w-4 h-4 text-primary" />, description: 'Regular check-ins' },
  { value: 'low', label: 'Low', icon: <Activity className="w-4 h-4 text-muted-foreground" />, description: 'Background monitoring' },
];

const WatchlistDialog = ({ open, onOpenChange, suspectName, onConfirm, isLoading }: WatchlistDialogProps) => {
  const [priority, setPriority] = useState<WatchlistPriority>('medium');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    onConfirm(priority, notes || undefined);
    setPriority('medium');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-warning" />
            Add to Watchlist
          </DialogTitle>
          <DialogDescription>
            Add <span className="font-semibold text-foreground">{suspectName}</span> to the watchlist for enhanced monitoring.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Priority Level</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as WatchlistPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">— {opt.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add any relevant notes or reasons for monitoring..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="bg-warning text-warning-foreground hover:bg-warning/90">
            {isLoading ? 'Adding...' : 'Add to Watchlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WatchlistDialog;
