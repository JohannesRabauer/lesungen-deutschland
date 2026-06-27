import { Link } from 'react-router-dom';
import { BookOpen, Heart } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen className="h-5 w-5 text-literary-500" />
                            <span className="font-serif font-semibold text-gray-900">Lesungen Deutschland</span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Autorenlesungen und literarische Veranstaltungen in ganz Deutschland entdecken.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-3 text-sm">Navigation</h4>
                        <nav className="flex flex-col gap-2">
                            <Link to="/" className="text-sm text-gray-500 hover:text-literary-600 transition-colors">Lesungen</Link>
                            <Link to="/map" className="text-sm text-gray-500 hover:text-literary-600 transition-colors">Karte</Link>
                            <Link to="/about" className="text-sm text-gray-500 hover:text-literary-600 transition-colors">Über uns</Link>
                            <Link to="/impressum" className="text-sm text-gray-500 hover:text-literary-600 transition-colors">Impressum</Link>
                            <Link to="/datenschutz" className="text-sm text-gray-500 hover:text-literary-600 transition-colors">Datenschutz</Link>
                        </nav>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-3 text-sm">Quellen</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Daten werden automatisch von öffentlichen Bibliotheks- und Veranstaltungsseiten gesammelt.
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <p className="text-xs text-gray-400">
                        © {new Date().getFullYear()} Lesungen Deutschland
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        Erstellt mit <Heart className="h-3 w-3 text-literary-500" /> für Bücherfreunde
                    </p>
                </div>
            </div>
        </footer>
    );
}
