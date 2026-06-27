import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

interface MapComponentProps {
    events: ReadingEvent[];
    center?: [number, number];
    zoom?: number;
    className?: string;
}

export function MapComponent({ events, center = [51.1657, 10.4515], zoom = 6, className }: MapComponentProps) {
    // Filter to events with valid coordinates
    const mappableEvents = events.filter(e => e.location.lat !== 0 || e.location.lng !== 0);

    return (
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} className={className || 'rounded-xl z-0'}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mappableEvents.map(event => (
                <Marker key={event.id} position={[event.location.lat, event.location.lng]}>
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
            ))}
        </MapContainer>
    );
}
