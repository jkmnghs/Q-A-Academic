import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import HostPage from './pages/HostPage.jsx';
import ParticipantPage from './pages/ParticipantPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/host"           element={<HostPage />} />
        <Route path="/host/:code"     element={<HostPage />} />
        <Route path="/join"           element={<ParticipantPage />} />
        <Route path="/participate/:code" element={<ParticipantPage />} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
