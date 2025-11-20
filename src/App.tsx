import { useState } from 'react';
import { Header } from './components/Header';
import { MapComponent } from './components/MapComponent';
import { useEvents } from './hooks/useEvents';
import { MapPin, Calendar, List, Map as MapIcon, Navigation } from 'lucide-react';

function App() {
  const { events, loading, error } = useEvents();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<[number, number] | undefined>(undefined);

  const filteredEvents = events.filter(event =>
    event.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setViewMode('map');
          // Optionally sort list by distance here
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Standortzugriff verweigert oder nicht verfügbar.");
        }
      );
    } else {
      alert("Geolocation wird von diesem Browser nicht unterstützt.");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Laden...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Finde Lesungen in deiner Nähe</h1>
            <p className="text-gray-500">Entdecke Autoren und Events in ganz Deutschland.</p>
          </div>

          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
            >
              <List className="h-4 w-4" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors ${viewMode === 'map' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
            >
              <MapIcon className="h-4 w-4" />
              <span>Karte</span>
            </button>
          </div>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Suche nach Autor, Stadt oder Ort..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={handleNearMe}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
          >
            <Navigation className="h-4 w-4" />
            <span>In meiner Nähe</span>
          </button>
        </div>

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{event.author}</h3>
                      <p className="text-sm text-gray-500">{event.title}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {event.price.amount === 0 ? 'Kostenlos' : `${event.price.amount} €`}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {new Date(event.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {event.location.name}, {event.location.address}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      Details ansehen &rarr;
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <MapComponent events={filteredEvents} center={userLocation || [51.1657, 10.4515]} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
