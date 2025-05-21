/* global chrome */
import React, { createContext, useContext, useState, useEffect } from 'react';
import Notification from '../components/Notification/Notification';

interface Settings {
  extensionEnabled: boolean;
  debugMode: boolean;
  notificationsEnabled: boolean;
  autoSave: boolean;
  saveDelay: number;
  lastSaved: number;
  maxTimestamps: number;
  autoCleanup: boolean;
  cleanupThreshold: number;
  retryAttempts: number;
  retryDelay: number;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<Settings>;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<Settings>;
  isLoading: boolean;
  error: string | null;
  showNotification: (message: string) => void;
  hideNotification: () => void;
}

// Add default settings
const DEFAULT_SETTINGS: Settings = {
  extensionEnabled: true,
  debugMode: false,
  notificationsEnabled: true,
  autoSave: true,
  saveDelay: 500,
  lastSaved: Date.now(),
  maxTimestamps: 1000,
  autoCleanup: false,
  cleanupThreshold: 900,
  retryAttempts: 3,
  retryDelay: 1000
};

// Storage keys constant
const STORAGE_KEYS = {
  SETTINGS: 'settings'
} as const;

// Mock storage for development environment
const mockStorage = {
  data: new Map<string, any>(),
  get: async (key: string): Promise<any> => {
    console.log('Mock storage get:', key);
    const value = mockStorage.data.get(key);
    console.log('Mock storage value:', value);
    return value || null;
  },
  set: async (key: string, value: any): Promise<void> => {
    console.log('Mock storage set:', key, value);
    mockStorage.data.set(key, value);
  },
  remove: async (key: string): Promise<void> => {
    console.log('Mock storage remove:', key);
    mockStorage.data.delete(key);
  }
};

// Update the storage object with better error handling and type checking
const storage = {
  get: async (): Promise<Settings> => {
    try {
      if (!chrome?.storage) {
        console.log('Using mock storage for development environment');
        const storedSettings = await mockStorage.get(STORAGE_KEYS.SETTINGS);
        console.log('Retrieved settings from mock storage:', storedSettings);
        if (storedSettings) {
          return {
            ...DEFAULT_SETTINGS,
            ...storedSettings
          };
        }
        console.log('No stored settings found, using defaults');
        return DEFAULT_SETTINGS;
      }

      return new Promise((resolve) => {
        chrome.storage.local.get(STORAGE_KEYS.SETTINGS, (result) => {
          try {
            if (result.settings && typeof result.settings === 'object') {
              resolve({
                ...DEFAULT_SETTINGS,
                ...result.settings
              });
              return;
            }
            
            if (typeof result.settings === 'string') {
              resolve({
                ...DEFAULT_SETTINGS,
                ...JSON.parse(result.settings)
              });
              return;
            }

            resolve(DEFAULT_SETTINGS);
          } catch (parseError) {
            console.error('Error parsing settings:', parseError);
            resolve(DEFAULT_SETTINGS);
          }
        });
      });
    } catch (error) {
      console.error('Error accessing storage:', error);
      return DEFAULT_SETTINGS;
    }
  },

  set: async (settings: Partial<Settings>): Promise<void> => {
    try {
      const settingsToStore = typeof settings === 'string' ? JSON.parse(settings) : settings;

      if (!chrome?.storage) {
        console.log('Using mock storage for development environment');
        await mockStorage.set(STORAGE_KEYS.SETTINGS, settingsToStore);
        return;
      }

      return new Promise((resolve) => {
        chrome.storage.local.set({ 
          [STORAGE_KEYS.SETTINGS]: settingsToStore 
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving settings:', chrome.runtime.lastError);
            throw chrome.runtime.lastError;
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  clear: async (): Promise<void> => {
    try {
      if (!chrome?.storage) {
        console.log('Using mock storage for development environment');
        await mockStorage.remove(STORAGE_KEYS.SETTINGS);
        return;
      }

      return new Promise((resolve) => {
        chrome.storage.local.remove(STORAGE_KEYS.SETTINGS, () => {
          if (chrome.runtime.lastError) {
            console.error('Error clearing settings:', chrome.runtime.lastError);
            throw chrome.runtime.lastError;
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('Error clearing settings:', error);
      throw error;
    }
  }
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showNotification = (message: string) => {
    setNotification(message);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const loadSettings = async () => {
    console.log('Starting to load settings...');
    try {
      const loadedSettings = await storage.get();
      console.log('Settings loaded successfully:', loadedSettings);
      setSettings(loadedSettings);
      setError(null);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
      setSettings(DEFAULT_SETTINGS);
    } finally {
      console.log('Finished loading settings, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>): Promise<Settings> => {
    try {
      const updatedSettings = { 
        ...settings,
        ...newSettings,
        lastSaved: Date.now() 
      };
      await storage.set(updatedSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const updateSetting = async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ): Promise<Settings> => {
    try {
      const updatedSettings = {
        ...settings,
        [key]: value,
        lastSaved: Date.now()
      };
      await storage.set(updatedSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('SettingsProvider mounted, loading settings...');
    loadSettings();

    if (chrome?.storage) {
      console.log('Chrome storage available, setting up storage change listener');
      const handleStorageChange = (
        changes: { [key: string]: chrome.storage.StorageChange }
      ) => {
        try {
          if (changes.settings) {
            console.log('Storage change detected:', changes.settings);
            const newValue = changes.settings.newValue;
            const oldValue = changes.settings.oldValue;

            let newSettings: Settings;
            try {
              newSettings = typeof newValue === 'string' ? JSON.parse(newValue) : newValue;
              if (!newSettings || typeof newSettings !== 'object') {
                console.error('Invalid settings format:', newSettings);
                return;
              }
            } catch (parseError) {
              console.error('Error parsing new settings:', parseError);
              return;
            }

            let oldSettings: Settings | null;
            try {
              oldSettings = oldValue ? 
                (typeof oldValue === 'string' ? JSON.parse(oldValue) : oldValue) 
                : null;
            } catch (parseError) {
              console.error('Error parsing old settings:', parseError);
              oldSettings = null;
            }

            if (!oldSettings || (newSettings.lastSaved > oldSettings.lastSaved)) {
              console.log('Updating settings with new values:', newSettings);
              setSettings(newSettings);
            }
          }
        } catch (error) {
          console.error('Error handling storage change:', error);
          setError('Failed to handle storage change');
        }
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    } else {
      console.log('Chrome storage not available, skipping storage change listener');
    }
  }, []);

  const value: SettingsContextType = {
    settings,
    updateSettings,
    updateSetting,
    isLoading,
    error,
    showNotification,
    hideNotification
  };

  if (isLoading) {
    console.log('SettingsProvider is still loading...');
    return <div className="loading">Loading settings...</div>;
  }

  if (error) {
    console.log('SettingsProvider encountered an error:', error);
    return <div className="error">Error: {error}</div>;
  }

  console.log('SettingsProvider rendering with settings:', settings);
  return (
    <SettingsContext.Provider value={value}>
      {children}
      {notification && (
        <Notification
          message={notification}
          onClose={hideNotification}
        />
      )}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;