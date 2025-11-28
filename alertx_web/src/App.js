import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './login';
import ControlCenter from './controlcenter';
import EmergencyAlertPage from './emergency';
import WarningPage from './warning';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
  <Route path="/controlcenter" element={<ControlCenter />} />
  <Route path="/emergency" element={<EmergencyAlertPage />} />
  <Route path="/warning" element={<WarningPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
