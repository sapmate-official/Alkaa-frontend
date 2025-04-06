
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner = ({ size = 'md', className }: SpinnerProps) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-2 border-current',
        {
          'h-3 w-3 border': size === 'sm',
          'h-5 w-5 border-2': size === 'md',
          'h-8 w-8 border-2': size === 'lg',
        },
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
};
