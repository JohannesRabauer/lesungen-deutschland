import { BookX, Search } from 'lucide-react';

interface EmptyStateProps {
    hasFilters: boolean;
    onClear?: () => void;
}

export function EmptyState({ hasFilters, onClear }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
            {hasFilters ? (
                <>
                    <Search className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="font-serif text-xl text-gray-700 mb-2">
                        Keine Lesungen gefunden
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm mb-4">
                        Versuche andere Suchbegriffe oder entferne Filter, um mehr Ergebnisse zu sehen.
                    </p>
                    {onClear && (
                        <button onClick={onClear} className="btn-secondary">
                            Filter zurücksetzen
                        </button>
                    )}
                </>
            ) : (
                <>
                    <BookX className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="font-serif text-xl text-gray-700 mb-2">
                        Noch keine Lesungen verfügbar
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                        Schau bald wieder vorbei — neue Veranstaltungen werden regelmäßig hinzugefügt.
                    </p>
                </>
            )}
        </div>
    );
}
