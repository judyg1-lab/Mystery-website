import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EnterPage from './components/EnterPage';
import LoginPage from './components/LoginPage';
import MainDashboard from './components/MainDashboard';

import TarotPage from './components/pages/TarotPage';
import BaZiPage from './components/pages/BaZiPage';
import ZiWeiPage from './components/pages/ZiWeiPage';
import AstrologyPage from './components/pages/AstrologyPage';

import ProfilePage from './components/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
