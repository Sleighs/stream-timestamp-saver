import './App.css';
import { useEffect, useState } from 'react';
import { useSettings } from './contexts/SettingsContext';
import StreamList from './components/StreamList/StreamList';
import OptionsPanel from './components/OptionsPanel/OptionsPanel';
import About from './components/About/About';

const STORAGE_KEYS = {
  SETTINGS: 'stream-timestamp-saver--settings', // Extension
  SAVED_TIMESTAMPS: 'savedTimestamps', // Extension
  LOCALSTORAGE_TIMESTAMPS: 'stream-timestamp-saver--timestamps', // Localstorage
};

const TABS = [
  {
    id: 'streams',
    label: 'Streams',
    icon: '🐦',
    component: StreamList
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    component: OptionsPanel
  },
  {
    id: 'about',
    label: 'About',
    icon: 'ℹ️',
    component: About
  }
];

function App() {
  const { settings, isLoading: isSettingsLoading, updateSettings, showNotification } = useSettings();
  const [activeTab, setActiveTab] = useState('streams');
  const [savedStreams, setSavedStreams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPopup, setIsPopup] = useState(false);

  const loadStreams = async () => {
    try {
      // Check if we're offline
      if (!navigator.onLine || !chrome.storage) {
        setError('You are offline. Please check your internet connection and try again.');
        setSavedStreams([]); // Set empty array to prevent undefined errors
        return;
      } 

      // Get streams from both storage types
      const [localResult, syncResult] = await Promise.all([
        chrome.storage?.local.get(''),
        chrome.storage?.sync.get('')
      ]);

      // Parse streams from both storages
      const localStreams = localResult.streams ? JSON.parse(localResult.streams) : [];
      const syncStreams = syncResult.streams ? JSON.parse(syncResult.streams) : [];

      // Combine and deduplicate streams based on URL
      const allStreams = [...localStreams, ...syncStreams];
      const uniqueStreams = Array.from(
        new Map(allStreams.map(stream => [stream.url, stream])).values()
      );
      
      setSavedStreams(uniqueStreams);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error loading streams:', err);
      if (!navigator.onLine) {
        setError('You are offline. Please check your internet connection and try again.');
      } else {
        setError('Failed to load streams. Please try again.');
      }
      setSavedStreams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!navigator.onLine) {
      setError('You are offline. Please check your internet connection and try again.');
      return;
    }
    setIsLoading(true);
    await loadStreams();
  };

  const handleToggleExtension = async () => {
    try {
      await updateSettings({ enableExtension: !settings.enableExtension });
      showNotification(`Extension ${settings.enableExtension ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Error toggling extension:', error);
      showNotification('Failed to toggle extension');
    }
  };

  const handleOpenInTab = () => {
    if (chrome.runtime?.id) {
      chrome.tabs.create({
        url: chrome.runtime.getURL('dist/index.html')
      });
      // If we're in the popup, close it
      if (isPopup) {
        window.close();
      }
    }
  };

  useEffect(() => {
    // Check if we're in popup mode by checking window dimensions
    setIsPopup(window.innerWidth < 800);
    
    const loadData = async () => {
      setIsLoading(true);
      await loadStreams();
    };

    loadData();

    // Add offline/online event listeners
    const handleOnline = () => {
      setError(null);
      loadData();
    };

    const handleOffline = () => {
      setError('You are offline. Please check your internet connection and try again.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading || isSettingsLoading) {
    return <div className="loading">Loading...</div>;
  }

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component;


  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="header-brand-title">Stream Timestamp Saver</h1>
          <div className="header-controls">
            {isPopup && ( 
              <button className="open-in-tab-button" onClick={handleOpenInTab}>
                Open in Tab<span className="open-in-tab-icon">🔎</span> 
              </button>
            )}
            <div className="extension-toggle">
              <label className="toggle-label" htmlFor="extension-toggle">
                {settings.enableExtension ? 'On' : 'Off'}
              </label>
              <button
                id="extension-toggle"
                className={`toggle-switch ${settings.enableExtension ? 'enabled' : 'disabled'}`}
                onClick={handleToggleExtension}
                aria-label={`Extension is ${settings.enableExtension ? 'enabled' : 'disabled'}`}
                role="switch"
                aria-checked={settings.enableExtension}
              >
                <span className="toggle-track"></span>
                <span className="toggle-thumb"></span>
              </button>
            </div>
          </div>
        </div>
        <nav className="app-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`app-header-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {(error && (activeTab !== 'about')) && (
        <div className="error-message">
          {error}
        </div>
      )}

      <main className="app-main">
        {ActiveComponent && (
          activeTab === 'streams' ? (
            <ActiveComponent
              onRefresh={handleRefresh}
              settings={settings}
              error={error}
            />
          ) : activeTab === 'about' ? (
            <ActiveComponent />
          ) : (
            //Settings Tab
            <ActiveComponent
              settings={settings}
              onSettingChange={updateSettings}
            />
          )
        )}
      </main>
    </div>
  );
}

export default App;
