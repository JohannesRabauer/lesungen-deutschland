import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ReadingEvent, EventFilter, SortOption } from '../types';
import { getUniqueValues, isPastEvent } from '../lib/utils';

const EVENTS_DATA_URL = `${import.meta.env.BASE_URL}data/events.json`;

export function useEvents() {
    const [events, setEvents] = useState<ReadingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const filters: EventFilter = useMemo(() => ({
        search: searchParams.get('q') || undefined,
        audienceGroup: searchParams.get('audience') || undefined,
        source: searchParams.get('source') || undefined,
        city: searchParams.get('city') || undefined,
        freeOnly: searchParams.get('free') === '1' || undefined,
        showPast: searchParams.get('past') === '1' || undefined,
    }), [searchParams]);

    const sort: SortOption = (searchParams.get('sort') as SortOption) || 'date-asc';

    const fetchEvents = useCallback(() => {
        setLoading(true);
        setError(null);
        fetch(EVENTS_DATA_URL)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data: ReadingEvent[]) => {
                setEvents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch events:", err);
                setError("Veranstaltungen konnten nicht geladen werden.");
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        // Initial data load — loading is already true from initial state
        fetch(EVENTS_DATA_URL)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data: ReadingEvent[]) => {
                setEvents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch events:", err);
                setError("Veranstaltungen konnten nicht geladen werden.");
                setLoading(false);
            });
    }, []);

    const filteredEvents = useMemo(() => {
        let result = events;

        if (!filters.showPast) {
            const now = new Date();
            result = result.filter(e => !isPastEvent(e.date, now));
        }

        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(e =>
                e.title.toLowerCase().includes(q) ||
                e.author.toLowerCase().includes(q) ||
                (e.reader?.toLowerCase().includes(q)) ||
                (e.work?.toLowerCase().includes(q)) ||
                e.location.name.toLowerCase().includes(q) ||
                e.location.address.toLowerCase().includes(q)
            );
        }

        if (filters.audienceGroup) {
            result = result.filter(e =>
                e.targetAudience?.group?.toLowerCase() === filters.audienceGroup!.toLowerCase()
            );
        }

        if (filters.source) {
            result = result.filter(e => e.source === filters.source);
        }

        if (filters.city) {
            const city = filters.city.toLowerCase();
            result = result.filter(e =>
                e.location.address.toLowerCase().includes(city) ||
                e.location.name.toLowerCase().includes(city)
            );
        }

        if (filters.freeOnly) {
            result = result.filter(e => e.price.amount === 0);
        }

        if (filters.dateRange) {
            const start = new Date(filters.dateRange.start);
            const end = new Date(filters.dateRange.end);
            result = result.filter(e => {
                const d = new Date(e.date);
                return d >= start && d <= end;
            });
        }

        // Sort
        result = [...result].sort((a, b) => {
            switch (sort) {
                case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'price-asc': return a.price.amount - b.price.amount;
                case 'price-desc': return b.price.amount - a.price.amount;
                case 'author-asc': return a.author.localeCompare(b.author);
                default: return 0;
            }
        });

        return result;
    }, [events, filters, sort]);

    const setFilter = useCallback((key: string, value: string | null) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (value) {
                next.set(key, value);
            } else {
                next.delete(key);
            }
            return next;
        });
    }, [setSearchParams]);

    const clearFilters = useCallback(() => {
        setSearchParams(new URLSearchParams());
    }, [setSearchParams]);

    const audienceGroups = useMemo(() =>
        getUniqueValues(events, e => e.targetAudience?.group),
        [events]
    );

    const sources = useMemo(() =>
        getUniqueValues(events, e => e.source),
        [events]
    );

    const cities = useMemo(() => {
        const citySet = new Set<string>();
        for (const e of events) {
            const addr = e.location.address;
            if (addr) {
                // Try to extract city from address (last part after comma, or full string)
                const parts = addr.split(',');
                const city = parts[parts.length - 1]?.trim();
                if (city) citySet.add(city);
            }
        }
        return Array.from(citySet).sort();
    }, [events]);

    return {
        events,
        filteredEvents,
        loading,
        error,
        filters,
        sort,
        setFilter,
        clearFilters,
        audienceGroups,
        sources,
        cities,
        retry: fetchEvents,
        totalCount: events.length,
    };
}
