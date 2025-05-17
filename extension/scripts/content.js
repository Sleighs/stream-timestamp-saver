/* Welcome to Stream Timestamp Saver*/
console.log('[Stream Timestamp Saver] Content Script Loaded');

const browser = chrome || browser;

let settings = {
  enableExtension: true,
  browserStorageType: 'local',
  debugMode: true,
  notificationsEnabled: true,
  autoSave: true,
  saveInterval: 4000,
  saveDelay: 500,
  autoLoad: false,
  autoLoadDelay: 2000,
};

let timestamps = [];

// Debug logging system
const debug = {
  getCallerInfo() {
    try {
      const error = new Error();
      const stackLines = error.stack.split('\n');
      
      // Find the first relevant stack frame (skip Error, getCallerInfo, and log methods)
      for (let i = 3; i < stackLines.length; i++) {
        const line = stackLines[i].trim();
        
        // Enhanced patterns with better function name extraction
        const patterns = [
          // Named function with file info
          {
            pattern: /at ([^(]+) \((.+?):(\d+):(\d+)\)/,
            extract: (match) => ({
              func: match[1].split('.').pop().trim(),
              file: match[2],
              line: match[3]
            })
          },
          // Anonymous function or method with file info
          {
            pattern: /at (.+?):(\d+):(\d+)/,
            extract: (match) => ({
              func: 'anonymous',
              file: match[1],
              line: match[2]
            })
          },
          // Function call without line info
          {
            pattern: /at ([^(]+) \((.+)\)/,
            extract: (match) => ({
              func: match[1].split('.').pop().trim(),
              file: match[2],
              line: '?'
            })
          }
        ];

        for (const { pattern, extract } of patterns) {
          const match = line.match(pattern);
          if (match) {
            const { func, file, line } = extract(match);
            const shortFile = file.split('/').pop().split('\\').pop();
            const cleanName = func
              .replace('async ', '')
              .replace('(anonymous)', 'anonymous')
              .replace(/^Function$/, 'anonymous')
              .replace(/^Object\./, '')
              .trim();
            
            return `[${cleanName} @ ${shortFile}:${line}]`;
          }
        }

        // If no patterns match but we have a line, try to extract something useful
        const fallbackMatch = line.match(/at (.+)/);
        if (fallbackMatch) {
          const cleanName = fallbackMatch[1]
            .split(' ')[0]
            .split('.').pop()
            .replace('async ', '')
            .replace(/[(<].*/, '')
            .trim();
          return `[${cleanName}]`;
        }
      }
    } catch (error) {
      console.error('Error in getCallerInfo:', error);
    }
    return '[unknown]';
  },
  
  log: (message, ...args) => {
    if (settings?.debugMode) {
      const callerInfo = debug.getCallerInfo();
      console.log(`[Stream Timestamp Saver] ${callerInfo} ${message}`, ...args);
    }
  },

  error: (message, error, ...args) => {
    if (settings?.debugMode) {
      const callerInfo = debug.getCallerInfo();
      console.error(`[Stream Timestamp Saver] ${callerInfo} ${message}:`, error, ...args);
    }
  },

  warn: (message, ...args) => {
    if (settings?.debugMode) {
      const callerInfo = debug.getCallerInfo();
      console.warn(`[Stream Timestamp Saver] ${callerInfo} ${message}`, ...args);
    }
  }
};


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
    const { url } = videoDetails;

    // Basic video info
    this.url = url;
    this.videoId = this.extractVideoId(url);
    this.videoUrl = url;
    this.videoTitle = videoDetails.videoTitle || '';
    this.channelName = videoDetails.channelName || '';

    // Playback state
    this.isLive = videoDetails.isLive || false;
    this.isEnded = false;
    this.currentTime = videoDetails.currentTime || 0;
    this.totalTime = videoDetails.totalTime || 0;
    this.videoElement = null;

    // Stream timing
    this.streamStartTime = Date.now();
    this.streamEndTime = 0;
    this.streamDuration = 0;

    // Session info
    this.sessionId = videoDetails.sessionId || this.generateSessionId();
    this.lastSavedTime = videoDetails.lastSavedTime || 0;
    this.lastSaveTimestamp = videoDetails.lastSaveTimestamp || 0;
    this.watchHistory = videoDetails.watchHistory || [];
  }

  generateSessionId() {
    // Generate a unique session ID using timestamp and random number
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractVideoId(url) {
    try {
      if (url.includes('youtube.com')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        return urlParams.get('v') || '';
      } else if (url.includes('rumble.com')) {
        const matches = url.match(/\/([a-zA-Z0-9-]+)-\d+/);
        return matches ? matches[1] : '';
      }
    } catch (error) {
      debug.error('Error extracting video ID:', error);
    }
    return '';
  }

  updateTime(currentTime) {
    this.currentTime = currentTime;
    this.lastSavedTime = currentTime;
    this.lastSaveTimestamp = Date.now();

    // Only add to watch history if time has changed significantly (more than 1 second)
    const lastEntry = this.watchHistory[this.watchHistory.length - 1];
    if (!lastEntry || Math.abs(lastEntry.time - currentTime) > 1) {
      this.watchHistory.push({
        time: currentTime,
        formattedTime: this.formatTime(currentTime),
        timestamp: Date.now()
      });
    }
  }

  formatTime(time) {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getStorageKey() {
    return `timestamp-${this.videoId}`;
  }

  toJSON() {
    return {
      url: this.url,
      videoId: this.videoId,
      videoTitle: this.videoTitle,
      channelName: this.channelName,
      isLive: this.isLive,
      isEnded: this.isEnded,
      currentTime: this.currentTime,
      totalTime: this.totalTime,
      lastSavedTime: this.lastSavedTime,
      lastSaveTimestamp: this.lastSaveTimestamp,
      streamStartTime: this.streamStartTime,
      streamEndTime: this.streamEndTime,
      sessionId: this.sessionId,
      watchHistory: this.watchHistory
    };
  }
}

// Storage Manager for handling both chrome.storage and localStorage
class StorageManager {
  static async saveVideo(video) {
    const data = video.toJSON();
    const key = video.getStorageKey();
    
    try {
      // Save to chrome.storage
      await chrome.storage.local.set({ [key]: data });
      
      // Save to localStorage as backup
      try {
        // Get existing saved videos array or create new one
        const savedVideos = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_TIMESTAMPS) || '[]');
        
        // Update or add video data
        const existingIndex = savedVideos.findIndex(v => v.videoId === video.videoId);
        if (existingIndex !== -1) {
          savedVideos[existingIndex] = data;
        } else {
          savedVideos.push(data);
        }
        
        // Save back to localStorage
        localStorage.setItem(STORAGE_KEYS.SAVED_TIMESTAMPS, JSON.stringify(savedVideos));
      } catch (error) {
        debug.error('Error saving to localStorage:', error);
      }
      
      debug.log('Saved video data:', data);
    } catch (error) {
      debug.error('Error saving video data:', error);
    }
  }

  static async loadVideo(videoId) {
    const key = `timestamp-${videoId}`;
    
    try {
      // Try chrome.storage first
      const result = await chrome.storage.local.get(key);
      if (result[key]) {
        return result[key];
      }
      
      // Fallback to localStorage
      try {
        const savedVideos = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_TIMESTAMPS) || '[]');
        return savedVideos.find(v => v.videoId === videoId);
      } catch (error) {
        debug.error('Error reading from localStorage:', error);
      }
    } catch (error) {
      debug.error('Error loading video data:', error);
    }
    
    return null;
  }

  static async getAllSavedVideos() {
    try {
      // Get from chrome.storage
      const result = await chrome.storage.local.get(null);
      const videos = Object.values(result).filter(item => item.videoId);
      
      // Merge with localStorage videos
      try {
        const localVideos = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_TIMESTAMPS) || '[]');
        // Merge and remove duplicates based on videoId
        const allVideos = [...videos, ...localVideos];
        const uniqueVideos = allVideos.filter((v, index, self) =>
          index === self.findIndex((t) => t.videoId === v.videoId)
        );
        return uniqueVideos;
      } catch (error) {
        debug.error('Error reading from localStorage:', error);
        return videos;
      }
    } catch (error) {
      debug.error('Error getting all saved videos:', error);
      return [];
    }
  }
}

const getVideoDetails = (url) => {
  const videoElement = getVideoElement();
  const videoDetails = {
    url,
    isLive: false,
    currentTime: videoElement?.currentTime || 0,
    totalTime: videoElement?.duration || 0,
    videoElement: videoElement,
    streamStartTime: Date.now(),
    streamEndTime: 0,
    streamDuration: 0,
    channelName: '',
    videoTitle: '',
    videoId: '',
    videoUrl: url,
  };

  // Detect if it's a livestream and get video information
  if (videoElement) {
    if (url.includes('youtube.com')) {
      // Multiple selectors for video title to ensure we get it
      const titleSelectors = [
        'h1.ytd-video-primary-info-renderer',
        '#title h1',
        '#container h1',
        'ytd-watch-metadata h1'
      ];
      
      for (const selector of titleSelectors) {
        const titleElement = document.querySelector(selector);
        if (titleElement?.textContent?.trim()) {
          videoDetails.videoTitle = titleElement.textContent.trim();
          break;
        }
      }
      
      // Fallback to document title if no other title found
      if (!videoDetails.videoTitle) {
        videoDetails.videoTitle = document.title.replace(' - YouTube', '');
      }

      // Multiple selectors for channel name
      const channelSelectors = [
        '#owner-name a',
        '#channel-name a',
        '#upload-info a',
        'ytd-channel-name a'
      ];
      
      for (const selector of channelSelectors) {
        const channelElement = document.querySelector(selector);
        if (channelElement?.textContent?.trim()) {
          videoDetails.channelName = channelElement.textContent.trim();
          break;
        }
      }
      
      // Live detection
      videoDetails.isLive = document.querySelector('.ytp-live-badge') !== null ||
                           document.querySelector('[class*="live-badge"]') !== null;

      // Extract video ID from URL
      try {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoDetails.videoId = urlParams.get('v') || '';
      } catch (error) {
        debug.error('Error extracting video ID:', error);
      }
    }
    // Rumble live detection and info
    else if (url.includes('rumble.com')) {
      videoDetails.isLive = document.querySelector('.live-video-badge') !== null;
      videoDetails.channelName = document.querySelector('.media-by-channel')?.textContent?.trim() || '';
      videoDetails.videoTitle = document.title.replace(' | Rumble', '');
      
      // Extract video ID from URL for Rumble
      try {
        const matches = url.match(/\/([a-zA-Z0-9-]+)-\d+/);
        videoDetails.videoId = matches ? matches[1] : '';
      } catch (error) {
        debug.error('Error extracting Rumble video ID:', error);
      }
    }
  }
  
  debug.log('Video details:', videoDetails);
  return videoDetails;
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

class TimestampManager {
  constructor() {
    this.currentVideo = null;
    this.saveInterval = null;
    this.loadTimeout = null;
    this.lastSaveTime = 0;
    this.minSaveInterval = 4000;
    this.isRestoringTimestamp = false;
    this.initialLoadTime = Date.now();
    this.hasRestoredPosition = false;
    this.isSeeking = false;  // New flag to track seeking state
    this.restoreAttempts = 0;
    this.maxRestoreAttempts = 3;
    this.autoSaveDelay = 10000;
  }

  async initialize(videoElement, url) {
    if (!videoElement) return;
    
    debug.log('Initializing with video element and URL:', url);
    
    // First check if we have a saved timestamp for this video
    const videoId = this.extractVideoId(url);
    const savedData = await StorageManager.loadVideo(videoId);
    
    if (savedData) {
      debug.log('Found saved data:', savedData);
      
      // For quick refreshes, wait longer for video to stabilize
      const timeSinceLoad = Date.now() - this.initialLoadTime;
      debug.log('Time since page load:', timeSinceLoad, 'ms');
      
      if (timeSinceLoad < 15000) {
        debug.log('Quick refresh detected, waiting longer for video to stabilize');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Wait for video to be fully ready
      await this.waitForVideo(videoElement);
      
      // Try to restore the timestamp with retries
      await this.restoreVideoPosition(savedData);
    }
    
    const videoDetails = getVideoDetails(url);
    this.currentVideo = new Video(videoDetails);
    this.currentVideo.videoElement = videoElement;

    // Set up video event listeners
    this.setupEventListeners();

    // Start auto-save after position is confirmed
    this.scheduleAutoSave();
  }

  async waitForVideo(videoElement) {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (videoElement.readyState >= 3) { // Wait for ENOUGH_DATA
          debug.log('Video is fully ready. Ready state:', videoElement.readyState);
          resolve();
        } else {
          debug.log('Video not fully ready, waiting. Current ready state:', videoElement.readyState);
          videoElement.addEventListener('canplay', () => {
            debug.log('Video can play event fired');
            resolve();
          }, { once: true });
        }
      };
      checkReady();
    });
  }

  async restoreVideoPosition(savedData) {
    try {
      const videoElement = document.querySelector('video');
      if (!videoElement) {
        debug.log('No video element found for restoration');
        return;
      }

      debug.log('Attempting to restore video position from:', savedData);
      const savedTime = savedData.lastSavedTime;
      
      if (savedTime) {
        this.isRestoringTimestamp = true;
        
        // For quick refreshes, wait longer
        const timeSinceLoad = Date.now() - this.initialLoadTime;
        if (timeSinceLoad < 15000) {
          debug.log('Quick refresh detected, waiting for video to stabilize');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Function to attempt position restore
        const attemptRestore = async () => {
          debug.log('Restore attempt', this.restoreAttempts + 1, 'Setting time to:', savedTime);
          
          // Set position and pause briefly to help it stick
          videoElement.currentTime = savedTime;
          const wasPaused = videoElement.paused;
          if (!wasPaused) {
            videoElement.pause();
          }
          
          // Wait and verify
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Resume if it was playing
          if (!wasPaused) {
            videoElement.play();
          }
          
          const actualTime = videoElement.currentTime;
          debug.log('Video time after restore attempt:', actualTime);
          
          // Check if restore was successful
          if (Math.abs(actualTime - savedTime) > 1) {
            this.restoreAttempts++;
            if (this.restoreAttempts < this.maxRestoreAttempts) {
              debug.log('Restore not successful, retrying...');
              await new Promise(resolve => setTimeout(resolve, 1500));
              return attemptRestore();
            } else {
              debug.log('Max restore attempts reached');
            }
          } else {
            debug.log('Position restored successfully');
            this.hasRestoredPosition = true;
          }
        };

        await attemptRestore();
        
        // Enhanced position monitoring
        let monitoringAttempts = 0;
        const maxMonitoringAttempts = 10;
        const monitorPosition = setInterval(() => {
          if (!this.hasRestoredPosition || !videoElement) {
            clearInterval(monitorPosition);
            return;
          }
          
          monitoringAttempts++;
          const currentTime = videoElement.currentTime;
          
          // Check if position has drifted
          if (Math.abs(currentTime - savedTime) > 1) {
            debug.log('Position changed unexpectedly, attempt', monitoringAttempts, 'correcting...');
            
            // Only correct if we haven't exceeded max attempts
            if (monitoringAttempts < maxMonitoringAttempts) {
              videoElement.currentTime = savedTime;
            } else {
              debug.log('Max monitoring attempts reached, stopping monitor');
              clearInterval(monitorPosition);
              this.isRestoringTimestamp = false;
            }
          }
        }, 500);

        // Stop monitoring after 8 seconds (increased from 5)
        setTimeout(() => {
          clearInterval(monitorPosition);
          this.isRestoringTimestamp = false;
          debug.log('Position monitoring complete');
        }, 8000);
      }
    } catch (error) {
      debug.error('Error in restoreVideoPosition:', error);
      this.isRestoringTimestamp = false;
    }
  }

  scheduleAutoSave() {
    debug.log('Scheduling auto-save start');
    setTimeout(() => {
      // Modified condition to also check seeking state
      if (this.hasRestoredPosition || this.isSeeking) {
        debug.log('Starting auto-save after position confirmed');
        this.startAutoSave();
      } else {
        debug.log('Position not confirmed, delaying auto-save');
        this.scheduleAutoSave();
      }
    }, this.autoSaveDelay);
  }

  extractVideoId(url) {
    try {
      if (url.includes('youtube.com')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        return urlParams.get('v') || '';
      } else if (url.includes('rumble.com')) {
        const matches = url.match(/\/([a-zA-Z0-9-]+)-\d+/);
        return matches ? matches[1] : '';
      }
    } catch (error) {
      debug.error('Error extracting video ID:', error);
    }
    return '';
  }

  setupEventListeners() {
    const { videoElement } = this.currentVideo;
    if (!videoElement) return;

    // Only update time without saving on timeupdate
    videoElement.addEventListener('timeupdate', () => {
      if (this.currentVideo?.videoElement) {
        const currentTime = this.currentVideo.videoElement.currentTime;
        this.currentVideo.updateTime(currentTime);
      }
    });

    // Save on these events
    videoElement.addEventListener('pause', () => this.handleVideoPause());
    videoElement.addEventListener('ended', () => this.handleVideoEnded());
    videoElement.addEventListener('seeking', () => this.handleVideoSeeking());
  }

  handleVideoSeeking() {
    if (!this.currentVideo) return;
    
    this.isSeeking = true;
    // Set a timeout to reset the seeking state
    setTimeout(() => {
      this.isSeeking = false;
      // Ensure position is considered restored after user seeking
      this.hasRestoredPosition = true;
      this.saveTimestamp();
    }, 500);
  }

  handleVideoPause() {
    if (!this.currentVideo) return;
    this.saveTimestamp();
  }

  handleVideoEnded() {
    if (!this.currentVideo) return;
    
    this.currentVideo.isEnded = true;
    this.currentVideo.streamEndTime = Date.now();
    this.saveTimestamp();
    this.stopAutoSave();
  }

  startAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    
    this.saveInterval = setInterval(() => {
      // Modified condition to handle seeking state
      if (!this.isRestoringTimestamp && (this.hasRestoredPosition || this.isSeeking)) {
        if (this.currentVideo?.videoElement && !this.currentVideo.videoElement.paused) {
          debug.log('Auto-saving. Current time:', this.currentVideo.videoElement.currentTime);
          this.saveTimestamp();
        }
      } else {
        debug.log('Skipping auto-save - restoration in progress or position not yet restored');
      }
    }, this.minSaveInterval);
    
    debug.log(`Auto-save scheduled with ${this.minSaveInterval/1000} second interval`);
  }

  stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
      debug.log('Auto-save stopped');
    }
  }

  async saveTimestamp() {
    if (!this.currentVideo || this.isRestoringTimestamp) return;
    
    const now = Date.now();
    // Only save if enough time has passed since last save
    if (now - this.lastSaveTime >= this.minSaveInterval) {
      await StorageManager.saveVideo(this.currentVideo);
      this.lastSaveTime = now;
    }
  }
}

// Initialize the timestamp manager
const timestampManager = new TimestampManager();
debug.log('Created TimestampManager instance');

// Update the initialization function
(async function () {
  try {
    debug.log('Starting initialization process');
    
    if (!isExtensionContextValid()) {
      debug.error('Extension context is invalid');
      return;
    }
    debug.log('Extension context valid');
    
    await initializeOptions();
    debug.log('Options initialized');
    
    let retryCount = 0;
    const maxRetries = 10;
    
    const checkForVideo = async () => {
      debug.log('Checking for video element');
      const videoElement = getVideoElement();
      if (videoElement) {
        debug.log('Video element found:', videoElement);
        await timestampManager.initialize(videoElement, window.location.href);
        debug.log('TimestampManager initialized with video');
      } else if (retryCount < maxRetries) {
        retryCount++;
        debug.log(`Retry ${retryCount}/${maxRetries} - No video element yet`);
        setTimeout(checkForVideo, 1000);
      } else {
        debug.warn('Video element not found after maximum retries');
      }
    };

    await checkForVideo();
    debug.log('Initial video check complete');
  } catch (error) {
    debug.error('Error in initialization:', error);
  }
})();

// Listen for messages from options panel and frontend
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message.type) {
    debug.error('Invalid message received:', message);
    return;
  }

  switch (message.type) {
    case 'SETTING_UPDATED':
      const { key, value } = message.payload;
      settings[key] = value;

      // Handle specific settings
      if (key === 'debugMode') {
        debug.log(`Debug mode ${value ? 'enabled' : 'disabled'}`);
      } else if (key === 'autoSave') {
        if (value && timestampManager.currentVideo) {
          timestampManager.startAutoSave();
        } else {
          timestampManager.stopAutoSave();
        }
      } else if (key === 'saveInterval') {
        if (settings.autoSave && timestampManager.currentVideo) {
          timestampManager.startAutoSave(); // Restart with new interval
        }
      }

      // Save updated settings
      chrome.storage.local.set({ 
        settings: {
          ...settings,
          lastSaved: Date.now()
        }
      });
      break;

    case 'GET_VIDEO_STATE':
      if (timestampManager.currentVideo) {
        sendResponse({
          success: true,
          data: timestampManager.currentVideo.toJSON()
        });
      } else {
        sendResponse({
          success: false,
          error: 'No video currently playing'
        });
      }
      break;

    case 'SAVE_TIMESTAMP':
      timestampManager.saveTimestamp()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ 
          success: false, 
          error: error.message 
        }));
      break;

    case 'LOAD_TIMESTAMP':
      timestampManager.loadSavedTimestamp()
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ 
          success: false, 
          error: error.message 
        }));
      break;

    default:
      debug.warn('Unknown message type:', message.type);
      sendResponse({ 
        success: false, 
        error: 'Unknown message type' 
      });
  }

  return true; // Keep the message channel open for async responses
});

// Handle URL changes (for single-page apps like YouTube)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    debug.log('URL changed:', currentUrl);
    lastUrl = currentUrl;
    
    // Stop tracking the old video
    if (timestampManager.currentVideo) {
      timestampManager.stopAutoSave();
      timestampManager.saveTimestamp(); // Save one last time
      timestampManager.currentVideo = null;
    }

    // Initialize for the new video
    const videoElement = getVideoElement();
    if (videoElement) {
      timestampManager.initialize(videoElement, currentUrl);
    }
  }
}).observe(document, { subtree: true, childList: true });

