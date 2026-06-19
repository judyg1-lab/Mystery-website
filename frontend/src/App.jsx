import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

const EnterPage = lazy(() => import('./components/EnterPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const MainDashboard = lazy(() => import('./components/MainDashboard'));
const TarotPage = lazy(() => import('./components/pages/TarotPage'));
const BaZiPage = lazy(() => import('./components/pages/BaZiPage'));
const ZiWeiPage = lazy(() => import('./components/pages/ZiWeiPage'));
const AstrologyPage = lazy(() => import('./components/pages/AstrologyPage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));

const routeFallbackStyle = {
  width: '100vw',
  height: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: '#050208',
  color: '#d4af37',
  fontFamily: 'Cinzel, serif',
  letterSpacing: '0.22em',
  fontSize: '0.75rem'
};

const RouteFallback = () => (
  <div style={routeFallbackStyle}>LOADING</div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<EnterPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/maindashboard" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
          <Route path="/tarot" element={<ProtectedRoute><TarotPage /></ProtectedRoute>} />
          <Route path="/tarot/drawing" element={<ProtectedRoute><TarotPage /></ProtectedRoute>} />
          <Route path="/bazi" element={<ProtectedRoute><BaZiPage /></ProtectedRoute>} />
          <Route path="/ziwei" element={<ProtectedRoute><ZiWeiPage /></ProtectedRoute>} />
          <Route path="/astrology" element={<ProtectedRoute><AstrologyPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
