import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

const navLinks = [
    { to: '/', label: 'Lesungen' },
    { to: '/map', label: 'Karte' },
    { to: '/about', label: 'Über uns' },
];

export function Header() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link to="/" className="flex items-center gap-2 group">
                        <BookOpen className="h-7 w-7 text-literary-500 group-hover:text-literary-600 transition-colors" />
                        <span className="text-lg font-serif font-semibold text-gray-900">
                            Lesungen<span className="hidden sm:inline"> Deutschland</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                    location.pathname === link.to
                                        ? 'bg-literary-50 text-literary-600'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Menü öffnen"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile nav */}
                {mobileOpen && (
                    <nav className="md:hidden pb-4 animate-fade-in">
                        <div className="flex flex-col gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                        location.pathname === link.to
                                            ? 'bg-literary-50 text-literary-600'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}
