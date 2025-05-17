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

// Update the storage object with better error handling and type checking
const storage = {
  get: async (): Promise<Settings> => {
    try {
      if (!chrome?.storage) {
        console.warn('Chrome storage not available, returning default settings');
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
      if (!chrome?.storage) {
        throw new Error('Chrome storage not available');
      }

      const settingsToStore = typeof settings === 'string' ? JSON.parse(settings) : settings;

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
        throw new Error('Chrome storage not available');
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
    try {
      const loadedSettings = await storage.get();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
      setSettings(DEFAULT_SETTINGS);
    } finally {
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
    loadSettings();

    if (chrome?.storage) {
      const handleStorageChange = (
        changes: { [key: string]: chrome.storage.StorageChange }
      ) => {
        try {
          if (changes.settings) {
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