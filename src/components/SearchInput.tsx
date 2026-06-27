import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Suche nach Autor, Buch oder Ort...', className }: SearchInputProps) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [localValue, value, onChange]);

    const handleClear = useCallback(() => {
        setLocalValue('');
        onChange('');
    }, [onChange]);

    return (
        <div className={cn('relative', className)}>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
                type="text"
                value={localValue}
                onChange={e => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white
                    text-sm text-gray-800 placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-literary-500/20 focus:border-literary-300
                    transition-all duration-200"
            />
            {localValue && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Suche leeren"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
