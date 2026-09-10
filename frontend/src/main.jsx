import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import LandingPage from './LandingPage.jsx';

function Root() {
  const [page, setPage] = useState('landing');
  if (page === 'app') return <App onHome={() => setPage('landing')} />;
  return <LandingPage onStart={() => setPage('app')} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

