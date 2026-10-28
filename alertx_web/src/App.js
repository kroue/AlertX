import React, { lazy, Suspense } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './login';

const ControlCenter = lazy(() => import('./controlcenter'));
const EmergencyAlertPage = lazy(() => import('./emergency'));
const WarningPage = lazy(() => import('./warning'));
const Residents = lazy(() => import('./residents'));

function PageLoading() {
  return (
    <div role="status" aria-live="polite">
      Loading...
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/controlcenter" element={<ControlCenter />} />
          <Route path="/emergency" element={<EmergencyAlertPage />} />
          <Route path="/warning" element={<WarningPage />} />
          <Route path="/residents" element={<Residents />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
