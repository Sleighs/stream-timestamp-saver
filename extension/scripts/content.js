/* Welcome to Stream Timestamp Saver*/
console.log('Stream Timestamp Saver - Content Script Loaded');

const browser = chrome || browser;

let settings = {
  enableExtension: true,
  browserStorageType: 'local',
  debugMode: true,
  notificationsEnabled: true,
  autoSave: false,
  saveDelay: 500,
  autoLoad: false,
  autoLoadDelay: 2000,
};

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

// Add the missing initializeOptions function
const initializeOptions = async () => {
  try {
    const result = await chrome.storage.local.get('settings');
    if (result.settings) {
      settings = { ...settings, ...result.settings };
      debug.log('Settings loaded:', settings);
    } else {
      // Save default settings if none exist
      await chrome.storage.local.set({ settings });
      debug.log('Default settings saved:', settings);
    }
  } catch (error) {
    debug.error('Failed to initialize options:', error);
    // Continue with default settings
  }
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
    videoUrl: url,
    videoThumbnail: '',
    videoDescription: '',
    videoTags: [],
    videoCategory: '',
    videoLanguage: '',
  };
  
  debug.log('Stream Timestamp Saver - getVideoDetails', videoDetails);
  return videoDetails; // Add this return statement
};

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
    debug.log('Stream Timestamp Saver - Initialization');
    
    // Check if we're in a valid extension context
    if (!isExtensionContextValid()) {
      debug.error('Extension context is invalid');
      return;
    }
    
    // Load settings first
    await initializeOptions();
    
    // Get the current video element and wait for it if necessary
    let retryCount = 0;
    const maxRetries = 10;
    const checkForVideo = async () => {
      const videoElement = getVideoElement();
      if (videoElement) {
        debug.log('Video element found');
        const videoDetails = getVideoDetails(window.location.href);
        // Initialize video handling here
      } else if (retryCount < maxRetries) {
        retryCount++;
        debug.log(`Waiting for video element... (${retryCount}/${maxRetries})`);
        setTimeout(checkForVideo, 1000);
      } else {
        debug.warn('Video element not found after maximum retries');
      }
    };

    await checkForVideo();

    debug.log('Stream Timestamp Saver initialized');
  } catch (error) {
    debug.error('Error initializing Stream Timestamp Saver:', error);
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

