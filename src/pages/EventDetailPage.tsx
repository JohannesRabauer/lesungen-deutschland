import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, User, BookOpenText, ArrowLeft, ExternalLink, Tag } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { formatDate, formatTime } from '../lib/utils';
import { AudienceBadge } from '../components/AudienceBadge';
import { PriceBadge } from '../components/PriceBadge';
import { MapComponent } from '../components/MapComponent';
import { EventCard } from '../components/EventCard';

export function EventDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { events, loading } = useEvents();

    const event = events.find(e => e.id === id);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="animate-pulse space-y-6">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-8 w-2/3 bg-gray-200 rounded" />
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                    <div className="h-64 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                <h1 className="font-serif text-2xl text-gray-700 mb-4">Veranstaltung nicht gefunden</h1>
                <p className="text-gray-500 mb-6">Diese Lesung existiert nicht oder wurde entfernt.</p>
                <Link to="/" className="btn-primary">Zurück zur Übersicht</Link>
            </div>
        );
    }

    const displayAuthor = event.reader || event.author;
    const displayWork = event.work || event.title;
    const hasMap = event.location.lat !== 0 || event.location.lng !== 0;

    // Related events: same source or same author (limited)
    const relatedEvents = events
        .filter(e => e.id !== event.id && (e.source === event.source || e.author === event.author))
        .slice(0, 3);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Back link */}
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-literary-600 transition-colors mb-6">
                <ArrowLeft className="h-4 w-4" />
                Zurück zu allen Lesungen
            </Link>

            {/* Main content */}
            <article className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
                <div className="p-6 sm:p-8 lg:p-10">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <PriceBadge amount={event.price.amount} currency={event.price.currency} />
                        {event.targetAudience?.group && (
                            <AudienceBadge group={event.targetAudience.group} ageRange={event.targetAudience.ageRange} />
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                            <Tag className="h-3 w-3" />
                            {event.source}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-snug">
                        {displayWork}
                    </h1>

                    {/* Author / Reader */}
                    <div className="flex flex-wrap items-center gap-3 text-base text-gray-600 mb-6">
                        <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4 text-literary-500" />
                            <span className="font-medium">{displayAuthor}</span>
                        </div>
                        {event.reader && event.reader !== event.author && (
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <BookOpenText className="h-4 w-4" />
                                <span>Buch von {event.author}</span>
                            </div>
                        )}
                    </div>

                    {/* Date & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-cream-50 border border-cream-200">
                            <Calendar className="h-5 w-5 text-literary-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {formatDate(event.date)}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {formatTime(event.date)}
                                    {event.endDate && ` – ${formatTime(event.endDate)}`}
                                    {' Uhr'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-cream-50 border border-cream-200">
                            <MapPin className="h-5 w-5 text-literary-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {event.location.name}
                                </p>
                                {event.location.address && (
                                    <p className="text-sm text-gray-500">{event.location.address}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="mb-6">
                            <h2 className="font-serif text-lg font-semibold text-gray-900 mb-2">Beschreibung</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{event.description}</p>
                        </div>
                    )}

                    {/* Link to source */}
                    {event.url && (
                        <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary gap-2 inline-flex"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Zur Originalseite
                        </a>
                    )}
                </div>

                {/* Map */}
                {hasMap && (
                    <div className="h-64 sm:h-72 border-t border-gray-100">
                        <MapComponent
                            events={[event]}
                            center={[event.location.lat, event.location.lng]}
                            zoom={14}
                            className="z-0"
                        />
                    </div>
                )}
            </article>

            {/* Related events */}
            {relatedEvents.length > 0 && (
                <section className="mt-12">
                    <h2 className="font-serif text-xl font-semibold text-gray-900 mb-5">Ähnliche Lesungen</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {relatedEvents.map(e => (
                            <EventCard key={e.id} event={e} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
