import { motion } from 'framer-motion';
import { Crown, Medal, Award, Trophy } from 'lucide-react';

interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
}

const RankBadge = ({ rank, size = 'md' }: RankBadgeProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSize = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600',
          border: 'border-yellow-400/50',
          shadow: 'shadow-yellow-500/30',
          icon: Crown,
          glow: 'shadow-lg shadow-yellow-500/40',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500',
          border: 'border-slate-300/50',
          shadow: 'shadow-slate-400/30',
          icon: Medal,
          glow: 'shadow-lg shadow-slate-400/30',
        };
      case 3:
        return {
          bg: 'bg-gradient-to-br from-amber-600 via-orange-700 to-amber-800',
          border: 'border-amber-600/50',
          shadow: 'shadow-amber-600/30',
          icon: Award,
          glow: 'shadow-lg shadow-amber-600/30',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-primary/80 to-primary',
          border: 'border-primary/30',
          shadow: '',
          icon: null,
          glow: '',
        };
    }
  };

  const style = getRankStyle(rank);
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`
        ${sizeClasses[size]} 
        ${style.bg} 
        ${style.glow}
        rounded-full flex items-center justify-center 
        border-2 ${style.border}
        relative
      `}
    >
      {Icon ? (
        <Icon size={iconSize[size]} className="text-white drop-shadow-sm" />
      ) : (
        <span className="text-white font-bold text-sm">#{rank}</span>
      )}
      {rank <= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-white/20"
        />
      )}
    </motion.div>
  );
};

export default RankBadge;
