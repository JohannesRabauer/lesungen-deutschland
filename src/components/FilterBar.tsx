import { Filter, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface FilterBarProps {
    audienceGroups: string[];
    sources: string[];
    activeAudience: string | undefined;
    activeSource: string | undefined;
    freeOnly: boolean;
    showPast: boolean;
    onAudienceChange: (val: string | null) => void;
    onSourceChange: (val: string | null) => void;
    onFreeOnlyChange: (val: boolean) => void;
    onShowPastChange: (val: boolean) => void;
    onClearAll: () => void;
    hasActiveFilters: boolean;
}

export function FilterBar({
    audienceGroups,
    sources,
    activeAudience,
    activeSource,
    freeOnly,
    showPast,
    onAudienceChange,
    onSourceChange,
    onFreeOnlyChange,
    onShowPastChange,
    onClearAll,
    hasActiveFilters,
}: FilterBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400 mr-1">
                <Filter className="h-4 w-4" />
            </span>

            {/* Audience filter */}
            <select
                value={activeAudience || ''}
                onChange={e => onAudienceChange(e.target.value || null)}
                className={cn(
                    'px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer',
                    activeAudience
                        ? 'border-literary-300 bg-literary-50 text-literary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
            >
                <option value="">Zielgruppe</option>
                {audienceGroups.map(g => (
                    <option key={g} value={g}>{g}</option>
                ))}
            </select>

            {/* Source filter */}
            <select
                value={activeSource || ''}
                onChange={e => onSourceChange(e.target.value || null)}
                className={cn(
                    'px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer',
                    activeSource
                        ? 'border-literary-300 bg-literary-50 text-literary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
            >
                <option value="">Quelle</option>
                {sources.map(s => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>

            {/* Free only toggle */}
            <button
                onClick={() => onFreeOnlyChange(!freeOnly)}
                className={cn(
                    'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                    freeOnly
                        ? 'border-literary-300 bg-literary-50 text-literary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
            >
                Kostenlos
            </button>

            {/* Show past events toggle */}
            <button
                onClick={() => onShowPastChange(!showPast)}
                className={cn(
                    'px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                    showPast
                        ? 'border-literary-300 bg-literary-50 text-literary-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
            >
                Vergangene anzeigen
            </button>

            {/* Clear all */}
            {hasActiveFilters && (
                <button
                    onClick={onClearAll}
                    className="px-2 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                    <X className="h-3.5 w-3.5" />
                    Zurücksetzen
                </button>
            )}
        </div>
    );
}
