import { Link } from 'react-router-dom';
import { Calendar, MapPin, User, BookOpenText } from 'lucide-react';
import type { ReadingEvent } from '../types';
import { formatDate, formatTime, isPastEvent, cn } from '../lib/utils';
import { AudienceBadge } from './AudienceBadge';
import { PriceBadge } from './PriceBadge';

interface EventCardProps {
    event: ReadingEvent;
}

export function EventCard({ event }: EventCardProps) {
    const displayAuthor = event.reader || event.author;
    const displayWork = event.work || event.title;
    const isPast = isPastEvent(event.date);

    return (
        <Link
            to={`/event/${event.id}`}
            className={cn(
                'card group block p-0 overflow-hidden animate-fade-in',
                isPast && 'opacity-60'
            )}
        >
            <div className="p-5 sm:p-6">
                {/* Top row: badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {isPast && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                            Vergangen
                        </span>
                    )}
                    <PriceBadge amount={event.price.amount} currency={event.price.currency} />
                    {event.targetAudience?.group && (
                        <AudienceBadge group={event.targetAudience.group} ageRange={event.targetAudience.ageRange} />
                    )}
                </div>

                {/* Title / Work */}
                <h3 className="font-serif text-lg font-semibold text-gray-900 leading-snug mb-1 group-hover:text-literary-600 transition-colors line-clamp-2">
                    {displayWork}
                </h3>

                {/* Author / Reader */}
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
                    <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{displayAuthor}</span>
                    {event.reader && event.reader !== event.author && (
                        <span className="text-gray-400 truncate">
                            <BookOpenText className="inline h-3 w-3 mx-0.5" />
                            {event.author}
                        </span>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-literary-400 flex-shrink-0" />
                        <span>
                            {formatDate(event.date, { weekday: 'short', day: 'numeric', month: 'short' })}
                            {' · '}
                            {formatTime(event.date)}
                            {event.endDate && ` – ${formatTime(event.endDate)}`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-literary-400 flex-shrink-0" />
                        <span className="truncate">
                            {event.location.name}
                            {event.location.address && `, ${event.location.address}`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom accent */}
            <div className="h-0.5 bg-gradient-to-r from-literary-400/0 via-literary-400/30 to-literary-400/0 group-hover:via-literary-500/50 transition-all" />
        </Link>
    );
}
