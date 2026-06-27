import { useState, useCallback } from 'react';
import { List, Map as MapIcon, Navigation } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/EventCard';
import { EventCardSkeleton } from '../components/EventCardSkeleton';
import { SearchInput } from '../components/SearchInput';
import { FilterBar } from '../components/FilterBar';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { MapComponent } from '../components/MapComponent';
import { cn } from '../lib/utils';

const PAGE_SIZE = 12;

export function HomePage() {
    const {
        filteredEvents,
        loading,
        error,
        filters,
        setFilter,
        clearFilters,
        audienceGroups,
        sources,
        retry,
        totalCount,
    } = useEvents();

    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [page, setPage] = useState(1);
    const [userLocation, setUserLocation] = useState<[number, number] | undefined>(undefined);

    const hasActiveFilters = Boolean(filters.search || filters.audienceGroup || filters.source || filters.freeOnly || filters.showPast);

    const paginatedEvents = filteredEvents.slice(0, page * PAGE_SIZE);
    const hasMore = paginatedEvents.length < filteredEvents.length;

    const handleSearch = useCallback((value: string) => {
        setFilter('q', value || null);
        setPage(1);
    }, [setFilter]);

    const handleNearMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                    setViewMode('map');
                },
                () => {
                    alert("Standortzugriff nicht verfügbar.");
                }
            );
        }
    };

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <ErrorState message={error} onRetry={retry} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Hero section */}
            <section className="mb-10">
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    Literarische Abende entdecken
                </h1>
                <p className="text-gray-500 text-base sm:text-lg max-w-2xl">
                    Finde Autorenlesungen, Buchvorstellungen und literarische Veranstaltungen in deiner Nähe.
                </p>
            </section>

            {/* Search and view toggle */}
            <section className="mb-6 flex flex-col sm:flex-row gap-3">
                <SearchInput
                    value={filters.search || ''}
                    onChange={handleSearch}
                    className="flex-grow"
                />
                <div className="flex gap-2">
                    <button
                        onClick={handleNearMe}
                        className="btn-secondary gap-1.5"
                    >
                        <Navigation className="h-4 w-4" />
                        <span className="hidden sm:inline">In meiner Nähe</span>
                    </button>
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                'px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors',
                                viewMode === 'list'
                                    ? 'bg-literary-500 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                            )}
                        >
                            <List className="h-4 w-4" />
                            <span className="hidden sm:inline">Liste</span>
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={cn(
                                'px-3 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors',
                                viewMode === 'map'
                                    ? 'bg-literary-500 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                            )}
                        >
                            <MapIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Karte</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Filter bar */}
            <section className="mb-8">
                <FilterBar
                    audienceGroups={audienceGroups}
                    sources={sources}
                    activeAudience={filters.audienceGroup}
                    activeSource={filters.source}
                    freeOnly={filters.freeOnly || false}
                    showPast={filters.showPast || false}
                    onAudienceChange={v => { setFilter('audience', v); setPage(1); }}
                    onSourceChange={v => { setFilter('source', v); setPage(1); }}
                    onFreeOnlyChange={v => { setFilter('free', v ? '1' : null); setPage(1); }}
                    onShowPastChange={v => { setFilter('past', v ? '1' : null); setPage(1); }}
                    onClearAll={() => { clearFilters(); setPage(1); }}
                    hasActiveFilters={hasActiveFilters}
                />
                {!loading && (
                    <p className="text-xs text-gray-400 mt-2">
                        {filteredEvents.length} von {totalCount} Veranstaltungen
                    </p>
                )}
            </section>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <EventCardSkeleton key={i} />
                    ))}
                </div>
            ) : viewMode === 'list' ? (
                filteredEvents.length === 0 ? (
                    <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {paginatedEvents.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="flex justify-center mt-10">
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    className="btn-secondary"
                                >
                                    Mehr Lesungen laden
                                </button>
                            </div>
                        )}
                    </>
                )
            ) : (
                <div className="h-[500px] sm:h-[600px] rounded-2xl overflow-hidden border border-gray-200 shadow-card">
                    <MapComponent
                        events={filteredEvents}
                        center={userLocation || [51.1657, 10.4515]}
                        zoom={userLocation ? 11 : 6}
                    />
                </div>
            )}
        </div>
    );
}
