import { BookOpen, Database, Clock, Globe } from 'lucide-react';

export function AboutPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Über Lesungen Deutschland
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed mb-10">
                Wir sammeln Informationen über Autorenlesungen, Buchvorstellungen und literarische
                Veranstaltungen aus ganz Deutschland an einem Ort — damit du einfacher das nächste
                literarische Erlebnis in deiner Nähe findest.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                <div className="card p-6">
                    <Database className="h-6 w-6 text-literary-500 mb-3" />
                    <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Automatisch gesammelt</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Unsere Scraper durchsuchen regelmäßig die Webseiten von Bibliotheken und
                        Kultureinrichtungen, um aktuelle Veranstaltungen zu finden.
                    </p>
                </div>
                <div className="card p-6">
                    <Clock className="h-6 w-6 text-literary-500 mb-3" />
                    <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Regelmäßig aktualisiert</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Die Daten werden mehrmals täglich aktualisiert, sodass du immer die neuesten
                        Veranstaltungen findest.
                    </p>
                </div>
                <div className="card p-6">
                    <BookOpen className="h-6 w-6 text-literary-500 mb-3" />
                    <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Für Bücherfreunde</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Egal ob Kinderbuch-Lesung, Poetry Slam oder Autorenabend — wir helfen dir,
                        das passende Event zu finden.
                    </p>
                </div>
                <div className="card p-6">
                    <Globe className="h-6 w-6 text-literary-500 mb-3" />
                    <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">Deutschlandweit</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Von München bis Hamburg, von Köln bis Berlin — wir erfassen Lesungen in allen
                        Regionen Deutschlands.
                    </p>
                </div>
            </div>

            <section className="mb-12">
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Unsere Quellen</h2>
                <p className="text-gray-600 mb-4">
                    Aktuell werden folgende Einrichtungen automatisch durchsucht:
                </p>
                <ul className="space-y-2">
                    {[
                        'Münchner Stadtbibliothek',
                        'Stadtbüchereien Düsseldorf',
                        'Weitere Bibliotheken und Kultureinrichtungen',
                    ].map(source => (
                        <li key={source} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-literary-400 flex-shrink-0" />
                            {source}
                        </li>
                    ))}
                </ul>
            </section>

            <section>
                <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-4">Open Source</h2>
                <p className="text-gray-600 leading-relaxed">
                    Dieses Projekt ist Open Source. Der Quellcode ist auf{' '}
                    <a
                        href="https://github.com/JohannesRabauer/lesungen-deutschland"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-literary-600 hover:text-literary-700 underline underline-offset-2"
                    >
                        GitHub
                    </a>
                    {' '}verfügbar. Beiträge und Vorschläge für weitere Quellen sind willkommen!
                </p>
            </section>
        </div>
    );
}
