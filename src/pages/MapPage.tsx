import { useState } from 'react';
import { Navigation } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { MapComponent } from '../components/MapComponent';
import { SearchInput } from '../components/SearchInput';
import { ErrorState } from '../components/ErrorState';

export function MapPage() {
    const { filteredEvents, loading, error, filters, setFilter, retry } = useEvents();
    const [userLocation, setUserLocation] = useState<[number, number] | undefined>(undefined);

    const handleNearMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation([position.coords.latitude, position.coords.longitude]);
                },
                () => {
                    alert("Standortzugriff nicht verfügbar.");
                }
            );
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <ErrorState message={error} onRetry={retry} />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Top bar */}
            <div className="px-4 sm:px-6 py-3 bg-white border-b border-gray-100 flex gap-3 items-center">
                <SearchInput
                    value={filters.search || ''}
                    onChange={v => setFilter('q', v || null)}
                    className="flex-grow max-w-md"
                    placeholder="Suche auf der Karte..."
                />
                <button onClick={handleNearMe} className="btn-secondary gap-1.5 flex-shrink-0">
                    <Navigation className="h-4 w-4" />
                    <span className="hidden sm:inline">Mein Standort</span>
                </button>
                {!loading && (
                    <span className="text-xs text-gray-400 hidden sm:inline flex-shrink-0">
                        {filteredEvents.filter(e => e.location.lat !== 0 || e.location.lng !== 0).length} Orte
                    </span>
                )}
            </div>

            {/* Map */}
            <div className="flex-grow">
                {loading ? (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-literary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm text-gray-500">Karte wird geladen...</p>
                        </div>
                    </div>
                ) : (
                    <MapComponent
                        events={filteredEvents}
                        center={userLocation || [51.1657, 10.4515]}
                        zoom={userLocation ? 11 : 6}
                        className="z-0"
                        userLocation={userLocation}
                    />
                )}
            </div>
        </div>
    );
}
