import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { MapPage } from './pages/MapPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ImprintPage } from './pages/ImprintPage';
import { PrivacyPage } from './pages/PrivacyPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/event/:id" element={<EventDetailPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/impressum" element={<ImprintPage />} />
        <Route path="/datenschutz" element={<PrivacyPage />} />
      </Route>
    </Routes>
  );
}

export default App;
