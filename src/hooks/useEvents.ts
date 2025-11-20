import { useState, useEffect } from 'react';
import type { ReadingEvent, EventFilter } from '../types';

export function useEvents() {
    const [events, setEvents] = useState<ReadingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/data/events.json')
            .then(res => res.json())
            .then(data => {
                setEvents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch events:", err);
                setError("Failed to load events.");
                setLoading(false);
            });
    }, []);

    const filterEvents = (filter: EventFilter) => {
        return events.filter(event => {
            if (filter.author && !event.author.toLowerCase().includes(filter.author.toLowerCase())) {
                return false;
            }
            if (filter.maxPrice && event.price.amount > filter.maxPrice) {
                return false;
            }
            if (filter.dateRange) {
                const eventDate = new Date(event.date);
                if (eventDate < filter.dateRange.start || eventDate > filter.dateRange.end) {
                    return false;
                }
            }
            // Location filtering will be handled separately or needs Haversine formula here
            return true;
        });
    };

    return { events, loading, error, filterEvents };
}
