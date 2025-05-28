// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/index';
import Acceuil from './pages/Acceuil';
import Inscription from './pages/Inscription';
import SendInfo from './pages/SendInfo';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/Acceuil" element={<Acceuil />} />
        <Route path="/Inscription" element={<Inscription />} />
        <Route path="/SendInfo" element={<SendInfo />} />
      </Routes>
    </Router>
  );
}
