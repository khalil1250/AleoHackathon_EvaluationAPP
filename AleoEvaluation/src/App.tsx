// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/index';
import Acceuil from './pages/Acceuil';
import Inscription from './pages/Inscription';
import SendInfo from './pages/SendInfo';
import SeeInfo from './pages/SeeInfo';
import Account from './pages/Account';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/Inscription" element={<Inscription />} />
        <Route path="/Acceuil" element={<Acceuil />} />
        <Route path="/Acceuil/SendInfo" element={<SendInfo />} />
        <Route path="/Acceuil/SeeInfo" element={<SeeInfo />} />
        <Route path="/Acceuil/Account" element={<Account />} />
      </Routes>
    </Router>
  );
}
