import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  variant?: 'default' | 'threat' | 'success' | 'warning';
  delay?: number;
}

const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  variant = 'default',
  delay = 0 
}, ref) => {
  const variantStyles = {
    default: 'border-primary/20 hover:border-primary/40',
    threat: 'border-destructive/20 hover:border-destructive/40',
    success: 'border-success/20 hover:border-success/40',
    warning: 'border-warning/20 hover:border-warning/40',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    threat: 'bg-destructive/10 text-destructive',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  };

  const changeColors = {
    increase: 'text-success',
    decrease: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      className={`glass-card p-5 rounded-xl border transition-all duration-300 ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${iconStyles[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span className={`text-xs font-medium ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </motion.div>
  );
});

StatsCard.displayName = 'StatsCard';

export default StatsCard;
