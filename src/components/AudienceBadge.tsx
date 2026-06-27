import { cn } from '../lib/utils';

interface AudienceBadgeProps {
    group: string;
    ageRange?: string;
}

const groupColors: Record<string, string> = {
    'kinder': 'bg-amber-50 text-amber-700 border-amber-200',
    'jugendliche': 'bg-purple-50 text-purple-700 border-purple-200',
    'familien': 'bg-sky-50 text-sky-700 border-sky-200',
    'erwachsene': 'bg-warm-100 text-warm-700 border-warm-300',
    'senioren': 'bg-rose-50 text-rose-700 border-rose-200',
};

export function AudienceBadge({ group, ageRange }: AudienceBadgeProps) {
    const colorClass = groupColors[group.toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-200';

    return (
        <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
            colorClass
        )}>
            {group}
            {ageRange && <span className="ml-1 opacity-75">({ageRange})</span>}
        </span>
    );
}
