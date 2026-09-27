import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import OptimizerPage from './pages/OptimizerPage';
import './terrayield.css';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (currentPath === '/optimizer') {
    return <OptimizerPage onNavigate={navigate} />;
  }

  return <HomePage onNavigate={navigate} />;
}
