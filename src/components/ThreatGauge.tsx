import { motion } from 'framer-motion';

interface ThreatGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const ThreatGauge = ({ score, size = 56, strokeWidth = 4 }: ThreatGaugeProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--destructive))';
    if (score >= 50) return 'hsl(var(--warning))';
    return 'hsl(var(--success))';
  };

  const getGradientId = (score: number) => {
    if (score >= 80) return 'threatHigh';
    if (score >= 50) return 'threatMedium';
    return 'threatLow';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="threatHigh" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--destructive))" />
            <stop offset="100%" stopColor="hsl(0 84% 60%)" />
          </linearGradient>
          <linearGradient id="threatMedium" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--warning))" />
            <stop offset="100%" stopColor="hsl(38 92% 50%)" />
          </linearGradient>
          <linearGradient id="threatLow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--success))" />
            <stop offset="100%" stopColor="hsl(142 76% 46%)" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${getGradientId(score)})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span 
          className="text-sm font-bold"
          style={{ color: getColor(score) }}
        >
          {score}
        </span>
      </div>
    </div>
  );
};

export default ThreatGauge;
