import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
            <AlertCircle className="h-12 w-12 text-red-300 mb-4" />
            <h3 className="font-serif text-xl text-gray-700 mb-2">
                Etwas ist schiefgelaufen
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
                {message}
            </p>
            {onRetry && (
                <button onClick={onRetry} className="btn-primary flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Erneut versuchen
                </button>
            )}
        </div>
    );
}
