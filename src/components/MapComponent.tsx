import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Link } from 'react-router-dom';
import type { ReadingEvent } from '../types';
import { formatDate, formatTime, formatPrice } from '../lib/utils';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

/** Build a circular badge marker showing how many events share a location. */
function createCountIcon(count: number): L.DivIcon {
    const size = count >= 100 ? 46 : count >= 10 ? 40 : 34;
    const label = count > 999 ? '999+' : String(count);
    return L.divIcon({
        html: `<div style="
            width:${size}px;height:${size}px;line-height:${size}px;
            background:#7c3aed;color:#fff;border:2px solid #fff;border-radius:9999px;
            text-align:center;font-weight:600;font-size:13px;
            box-shadow:0 1px 4px rgba(0,0,0,0.35);">${label}</div>`,
        className: 'lesung-cluster-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });
}

interface LocationGroup {
    key: string;
    lat: number;
    lng: number;
    name: string;
    events: ReadingEvent[];
}

interface MapComponentProps {
    events: ReadingEvent[];
    center?: [number, number];
    zoom?: number;
    className?: string;
    userLocation?: [number, number];
}

export function MapComponent({ events, center = [51.1657, 10.4515], zoom = 6, className, userLocation }: MapComponentProps) {
    // Group events that share the same coordinates so overlapping markers
    // collapse into a single badge instead of stacking on top of each other.
    const groups = useMemo<LocationGroup[]>(() => {
        const map = new Map<string, LocationGroup>();
        for (const event of events) {
            const { lat, lng } = event.location;
            if (lat === 0 && lng === 0) continue;
            const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
            const existing = map.get(key);
            if (existing) {
                existing.events.push(event);
            } else {
                map.set(key, { key, lat, lng, name: event.location.name, events: [event] });
            }
        }
        return [...map.values()];
    }, [events]);

    return (
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} className={className || 'rounded-xl z-0'}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && (
                <CircleMarker
                    center={userLocation}
                    radius={9}
                    pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#2563eb', fillOpacity: 0.9 }}
                >
                    <Popup>
                        <span className="text-xs font-medium text-gray-900">Dein Standort</span>
                    </Popup>
                </CircleMarker>
            )}
            {groups.map(group => {
                if (group.events.length === 1) {
                    const event = group.events[0];
                    return (
                        <Marker key={group.key} position={[group.lat, group.lng]}>
                            <Popup>
                                <div className="min-w-[180px]">
                                    <h3 className="font-serif font-semibold text-sm text-gray-900 mb-1">
                                        {event.work || event.title}
                                    </h3>
                                    <p className="text-xs text-gray-600 mb-1">{event.reader || event.author}</p>
                                    <p className="text-xs text-gray-500 mb-1">
                                        {formatDate(event.date, { day: 'numeric', month: 'short' })} · {formatTime(event.date)}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">{event.location.name}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-literary-600">
                                            {formatPrice(event.price.amount, event.price.currency)}
                                        </span>
                                        <Link
                                            to={`/event/${event.id}`}
                                            className="text-xs font-medium text-literary-600 hover:text-literary-700"
                                        >
                                            Details →
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                }

                const sorted = [...group.events].sort(
                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                );
                const next = sorted[0];
                return (
                    <Marker key={group.key} position={[group.lat, group.lng]} icon={createCountIcon(group.events.length)}>
                        <Popup>
                            <div className="min-w-[200px]">
                                <h3 className="font-serif font-semibold text-sm text-gray-900 mb-1">
                                    {group.name}
                                </h3>
                                <p className="text-xs text-gray-600 mb-2">
                                    {group.events.length} Lesungen an diesem Ort
                                </p>
                                <p className="text-xs text-gray-500 mb-2">
                                    Nächste: {formatDate(next.date, { day: 'numeric', month: 'short' })} · {formatTime(next.date)}
                                </p>
                                <Link
                                    to={`/?q=${encodeURIComponent(group.name)}`}
                                    className="text-xs font-medium text-literary-600 hover:text-literary-700"
                                >
                                    Alle Lesungen anzeigen →
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
