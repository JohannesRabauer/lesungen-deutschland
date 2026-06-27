import { AlertTriangle } from 'lucide-react';

/**
 * Impressum (legal notice) required for German online services under sec. 5 DDG
 * (formerly sec. 5 TMG) and sec. 18 MStV.
 *
 * IMPORTANT: The operator's real contact details below are placeholders.
 * They MUST be filled in with accurate information before going live —
 * a missing or incorrect Impressum is a frequent target of Abmahnungen.
 */
export function ImprintPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
                Impressum
            </h1>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-10">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 leading-relaxed">
                    Hinweis für den Betreiber: Bitte ersetze die mit [eckigen Klammern]
                    markierten Platzhalter durch deine echten Angaben. Ein fehlendes oder
                    fehlerhaftes Impressum ist abmahngefährdet.
                </p>
            </div>

            <section className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">
                    Angaben gemäß § 5 DDG
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    [Vor- und Nachname / Name des Betreibers]<br />
                    [Straße und Hausnummer]<br />
                    [PLZ und Ort]<br />
                    Deutschland
                </p>
            </section>

            <section className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">Kontakt</h2>
                <p className="text-gray-700 leading-relaxed">
                    E-Mail: [kontakt@deine-domain.de]<br />
                    Telefon: [optional]
                </p>
            </section>

            <section className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">
                    Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    [Vor- und Nachname]<br />
                    [Anschrift wie oben]
                </p>
            </section>

            <section>
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">Haftung für Inhalte</h2>
                <p className="text-gray-600 leading-relaxed">
                    Die Veranstaltungsdaten auf dieser Seite werden automatisiert aus
                    öffentlich zugänglichen Quellen zusammengetragen und verlinken auf die
                    jeweilige Originalseite. Für die Richtigkeit, Vollständigkeit und
                    Aktualität der dort genannten Veranstaltungen können wir keine Gewähr
                    übernehmen. Sollten Sie Inhalte beanstanden – etwa als Rechteinhaber einer
                    Quelle oder als betroffene Person – kontaktieren Sie uns bitte über die oben
                    genannte Adresse; wir entfernen oder korrigieren betroffene Einträge
                    umgehend (siehe auch unsere{' '}
                    <a href="#/datenschutz" className="text-literary-600 hover:text-literary-700 underline underline-offset-2">
                        Datenschutzerklärung
                    </a>).
                </p>
            </section>
        </div>
    );
}
