import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { ReadingEvent } from '../types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
    events: ReadingEvent[];
    center?: [number, number];
}

export function MapComponent({ events, center = [51.1657, 10.4515] }: MapComponentProps) {
    return (
        // @ts-ignore
        <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }} className="rounded-xl z-0">
            {/* @ts-ignore */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {events.map(event => (
                <Marker key={event.id} position={[event.location.lat, event.location.lng]}>
                    <Popup>
                        <div className="p-1">
                            <h3 className="font-bold text-sm">{event.author}</h3>
                            <p className="text-xs">{event.location.name}</p>
                            <p className="text-xs">{new Date(event.date).toLocaleDateString()}</p>
                            <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-xs block mt-1">Details</a>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
