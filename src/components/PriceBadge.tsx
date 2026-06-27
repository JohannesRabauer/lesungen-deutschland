import { cn, formatPrice } from '../lib/utils';

interface PriceBadgeProps {
    amount: number;
    currency: string;
}

export function PriceBadge({ amount, currency }: PriceBadgeProps) {
    const isFree = amount === 0;

    return (
        <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
            isFree
                ? 'bg-literary-50 text-literary-700 border-literary-200'
                : 'bg-warm-50 text-warm-700 border-warm-200'
        )}>
            {formatPrice(amount, currency)}
        </span>
    );
}
