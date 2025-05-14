/* Welcome to Stream Timestamp Saver*/

const { channel } = require("diagnostics_channel");

const browser = chrome || browser;

let settings;

// Debug logging system
const debug = {
  log: (message, ...args) => {
    if (settings?.debugMode) {
      console.log(`[Stream Timestamp Saver] ${message}`, ...args);
    }
  },
  error: (message, error, ...args) => {
    if (settings?.debugMode) {
      console.error(`[Stream Timestamp Saver] ${message}:`, error, ...args);
    }
  },
  warn: (message, ...args) => {
    if (settings?.debugMode) {
      console.warn(`[Stream Timestamp Saver] ${message}`, ...args);
    }
  }
};

// Export debug functions for use throughout the code
const debugLog = debug.log;
const debugError = debug.error;
const debugWarn = debug.warn;
const initializeDebugMode = (enabled) => {
  settings.debugMode = enabled;
  if (enabled) {
    console.log('[Timestamp Saver] Debug mode initialized:', enabled);
  }
};

settings = {
  enableExtension: true,
  browserStorageType: 'local',
  debugMode: false,
  notificationsEnabled: true,
  autoSave: false,
  saveDelay: 500,
  autoLoad: false,
  autoLoadDelay: 2000,

};

const STORAGE_KEYS = {
  SETTINGS: 'stream-timestamp-saver--settings',
  SAVED_TIMESTAMPS: 'stream-timestamp-saver--savedtimestamps',
  LOCALSTORAGE_TIMESTAMPS: 'stream-timestamp-saver--localstorage-settings',
};

let url = window.location.href;

class Video {
  constructor(videoDetails) {
    const {
      url
    } = videoDetails;

    this.url = url;
    this.isLive = false;
    this.currentTime = 0;
    this.totalTime = 0;
    this.displayTimestamp = '';
    this.videoElement = null;
    this.streamStartTime = 0;
    this.streamEndTime = 0;
    this.streamDuration = 0;
    this.channelName = '';
    this.videoTitle = '';
    this.videoId = '';
    this.videoUrl = '';
    this.videoThumbnail = '';
    this.videoDescription = '';
    this.videoTags = [];
    this.videoCategory = '';
    this.videoLanguage = '';
  }
}

const getVideoDetails = (url) => {
  // Future details to collect
  const videoDetails = {
    isLive: false,
    currentTime: 0,
    totalTime: 0,
    displayTimestamp: '',
    videoElement: null,
    streamStartTime: 0,
    streamEndTime: 0,
    streamDuration: 0,
    channelName: '',
    videoTitle: '',
    videoId: '',
    videoUrl: '',
    videoThumbnail: '',
    videoDescription: '',
    videoTags: [],
    videoCategory: '',
    videoLanguage: '',
  };
  
  debugLog('Stream Timestamp Saver - getVideoDetails', url);
}

const getVideoElement = () => {
  const video = document.querySelector('video');
  if (video) {
    return video;
  }
  return null;
};

// Add a helper function to check extension context
const isExtensionContextValid = () => {
  return !!chrome.runtime?.id;
};

/////// Initialization ///////

(async function () {
  try {
    // Basic setup
    
    // Load settings first
    await initializeOptions();
    
    // Initialize icons
  
    // Ensure the stream is running

    // Get the current video element
    const videoElement = getVideoElement();
    if (videoElement) {
      const videoDetails = getVideoDetails(url);
    }

    if (settings.debugMode) console.log('Stream Timestamp Saver initialized');
  } catch (error) {
    if (settings.debugMode) console.error('Error initializing Stream Timestamp Saver:', error);
  }
})();


// Listen for messages from options panel and frontend
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SETTING_UPDATED') {
    const { key, value, notify } = message.payload;
    
    // Update the specific setting
    settings[key] = value;

    // Handle specific settings that need immediate updates
    switch (key) {
      case 'debugMode':
        settings.debugMode = value;
        if (notify) {
          showNotification(`Debug mode ${value ? 'enabled' : 'disabled'}`, 'info');
        }
        break;
    }

    // Save updated settings
    chrome.storage.local.set({ 
      settings: {
        ...settings,
        lastSaved: Date.now()
      }
    });
  } 
  
  sendResponse({ success: true });
  return true;
});

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    sendResponse({ settings });
  } else if (message.type === 'SAVE_TIMESTAMP') {
    const { timestamp, videoDetails } = message.payload;
    saveTimestamp(timestamp, videoDetails);
  } else if (message.type === 'LOAD_TIMESTAMP') {
    const { url } = message.payload;
    loadTimestamp(url);
  }
  
  return true;
});

