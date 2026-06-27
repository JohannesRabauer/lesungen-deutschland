import { AlertTriangle } from 'lucide-react';

/**
 * Datenschutzerklärung (privacy policy) under the GDPR / DSGVO.
 *
 * Covers: hosting (GitHub Pages), map tiles (OpenStreetMap), browser
 * geolocation, and processing of personal data (e.g. author names) taken from
 * public sources on the basis of legitimate interest (Art. 6(1)(f) DSGVO),
 * including the right to object and to erasure (takedown).
 *
 * IMPORTANT: Operator-specific contact details are placeholders and must be
 * completed before going live.
 */
export function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
                Datenschutzerklärung
            </h1>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-10">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 leading-relaxed">
                    Hinweis für den Betreiber: Diese Datenschutzerklärung ist eine Vorlage.
                    Bitte ergänze die [Platzhalter] und lasse sie vor Veröffentlichung
                    rechtlich prüfen.
                </p>
            </div>

            <section className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">
                    1. Verantwortlicher
                </h2>
                <p className="text-gray-700 leading-relaxed">
                    [Name des Betreibers]<br />
                    [Anschrift]<br />
                    E-Mail: [kontakt@deine-domain.de]
                </p>
            </section>

            <section className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">
                    2. Hosting (GitHub Pages)
                </h2>
                <p className="text-gray-600 leading-relaxed">
                    Diese Website wird bei GitHub Pages gehostet, einem Dienst der GitHub, Inc.,
                    88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. Beim Aufruf der
                    Seite verarbeitet GitHub technisch notwendige Server-Logdaten (insbesondere
                    Ihre IP-Adresse), um die Auslieferung der Website zu ermöglichen.
                    Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und
                    effizienten Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Eine Datenübermittlung in
                    die USA kann nicht ausgeschlossen werden.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">
                    3. Kartendarstellung (OpenStreetMap)
                </h2>
                <p className="text-gray-600 leading-relaxed">
                    Für die Kartenansicht laden wir Kartenkacheln von Servern der OpenStreetMap
                    Foundation (OSMF), St John’s Innovation Centre, Cowley Road, Cambridge, CB4
                    0WS, Vereinigtes Königreich. Dabei wird Ihre IP-Adresse an die OSMF
                    übermittelt, da dies technisch erforderlich ist, um die Karten in Ihrem
                    Browser anzuzeigen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Hinweise
                    finden Sie in der{' '}
                    <a
                        href="https://wiki.osmfoundation.org/wiki/Privacy_Policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-literary-600 hover:text-literary-700 underline underline-offset-2"
                    >
                        Datenschutzerklärung der OSMF
                    </a>.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">
                    4. Standortermittlung („In meiner Nähe“)
                </h2>
                <p className="text-gray-600 leading-relaxed">
                    Wenn Sie die Funktion „In meiner Nähe“ nutzen, fragt Ihr Browser Sie um
                    Erlaubnis und ermittelt Ihren ungefähren Standort. Diese Standortdaten
                    werden ausschließlich lokal in Ihrem Browser verarbeitet, um die Karte zu
                    zentrieren. Sie werden nicht an uns oder Dritte übertragen oder gespeichert.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">
                    5. Veranstaltungsdaten aus öffentlichen Quellen
                </h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                    Wir tragen Informationen zu literarischen Veranstaltungen (z. B. Titel,
                    Datum, Veranstaltungsort, ggf. Name der lesenden bzw. der schreibenden
                    Person) automatisiert aus öffentlich zugänglichen Quellen zusammen und
                    verlinken auf die Originalseite. Soweit dabei personenbezogene Daten (etwa
                    Namen von Autorinnen und Autoren) verarbeitet werden, stützen wir uns auf
                    unser berechtigtes Interesse, einen überregionalen Überblick über
                    öffentliche Lesungen bereitzustellen (Art. 6 Abs. 1 lit. f DSGVO). Es
                    handelt sich um Daten, die von den betroffenen Personen bzw. Veranstaltern
                    selbst öffentlich gemacht wurden.
                </p>
                <p className="text-gray-600 leading-relaxed">
                    Wir speichern bewusst keine wörtlich übernommenen Veranstaltungs­beschreibungen,
                    sondern nur die für die Auffindbarkeit notwendigen Eckdaten sowie einen Link
                    zur Quelle.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">
                    6. Ihre Rechte / Widerspruch &amp; Löschung
                </h2>
                <p className="text-gray-600 leading-relaxed mb-3">
                    Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung
                    (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit
                    (Art. 20) sowie auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO).
                </p>
                <p className="text-gray-600 leading-relaxed">
                    Möchten Sie einem Eintrag widersprechen oder dessen Löschung verlangen –
                    etwa als betroffene Person oder als Rechteinhaber einer Quelle – genügt eine
                    formlose Nachricht an{' '}
                    <span className="font-medium text-gray-800">[kontakt@deine-domain.de]</span>.
                    Wir entfernen betroffene Einträge zeitnah.
                </p>
            </section>

            <section>
                <h2 className="font-serif text-xl font-semibold text-gray-900 mb-3">
                    7. Beschwerderecht
                </h2>
                <p className="text-gray-600 leading-relaxed">
                    Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die
                    Verarbeitung Ihrer personenbezogenen Daten zu beschweren (Art. 77 DSGVO).
                </p>
            </section>
        </div>
    );
}
