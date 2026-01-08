import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import UploadSection from './components/UploadSection';
import DatabaseView from './components/DatabaseView';
import MatchingInterface from './components/MatchingInterface';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.body.className = savedTheme === 'light' ? 'light-mode' : '';
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme === 'light' ? 'light-mode' : '';
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <h1 className="app-title">
              <img src="/alphadataloho.jpg" alt="Company Logo" className="company-logo" />
              AI Hiring Assistant
            </h1>
            <div className="header-actions">
              <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
          <p className="app-tagline">Intelligent CV-JD Matching Powered by AI</p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="app-nav">
        <div className="container">
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload
            </button>
            <button
              className={`nav-tab ${activeTab === 'database' ? 'active' : ''}`}
              onClick={() => setActiveTab('database')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
              Database
            </button>
            <button
              className={`nav-tab ${activeTab === 'match' ? 'active' : ''}`}
              onClick={() => setActiveTab('match')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Match
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="app-main">
        <div className="container">
          {activeTab === 'upload' && (
            <UploadSection
              onSwitchToMatch={() => setActiveTab('match')}
            />
          )}
          {activeTab === 'database' && <DatabaseView />}
          {activeTab === 'match' && <MatchingInterface />}
        </div>
      </main>
    </div>
  );
}

export default App;
