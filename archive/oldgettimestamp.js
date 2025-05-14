/*
// Immediate console log to verify script loading
console.log('Stream Timestamp script starting...');

// Initialize functionality when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Stream Timestamp DOM ready - initializing...');
  
  // Page url
  const hostname = window.location.hostname;

  // Function to check if current video is a livestream
  function isLivestream() {
    if (hostname.includes("youtube.com")) {
      // Check for YouTube live badge
      return !!document.querySelector('.ytp-live-badge') || 
             !!document.querySelector('[class*="live-badge"]');
    } else if (hostname.includes("rumble.com")) {
      // Check for Rumble live indicator
      return !!document.querySelector('.live-indicator') ||
             document.querySelector('meta[property="og:type"]')?.content === 'video.live';
    }
    return false;
  }

  // Function to get current livestream timestamp
  function getLivestreamTimestamp() {
    const video = document.querySelector('video');
    if (!video) return null;

    if (hostname.includes("youtube.com")) {
      // Get YouTube timestamp element
      const timestampElement = document.querySelector('.ytp-time-current');
      return {
        currentTime: video.currentTime,
        displayTimestamp: timestampElement ? timestampElement.textContent : '',
        isLive: isLivestream()
      };
    } else if (hostname.includes("rumble.com")) {
      // Get Rumble timestamp
      const timestampElement = document.querySelector('.media-time-current');
      return {
        currentTime: video.currentTime,
        displayTimestamp: timestampElement ? timestampElement.textContent : '',
        isLive: isLivestream()
      };
    }
    return null;
  }

  // Initialize based on hostname
  if (hostname.includes("youtube.com")) {
    console.log("YouTube timestamp saver initializing...");
    
    function saveTime() {
      const video = document.querySelector('video');
      if (video) {
        const url = location.href.split('&')[0];
        const time = video.currentTime;
        chrome.storage.local.set({ [url]: time });
      }
    }

    function loadTime() {
      const video = document.querySelector('video');
      if (video) {
        const url = location.href.split('&')[0];
        chrome.storage.local.get(url, (result) => {
          const savedTime = result[url];
          if (savedTime && savedTime > 5) {
            video.currentTime = savedTime;
          }
        });
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) saveTime();
    });

    window.addEventListener('beforeunload', saveTime);
    window.addEventListener('load', () => {
      setTimeout(loadTime, 2000);
    });
  } else if (hostname.includes("rumble.com")) {
    function getVideoElement() {
      return document.querySelector('video');
    }

    function getPageKey() {
      const url = location.href.split(/[?#]/)[0];
      return url;
    }

    function saveTime() {
      const video = getVideoElement();
      if (video && !video.paused) {
        const time = video.currentTime;
        const key = getPageKey();
        chrome.storage.local.set({ [key]: time });
      }
    }

    function loadTime() {
      const video = getVideoElement();
      const key = getPageKey();
      chrome.storage.local.get(key, (result) => {
        const savedTime = result[key];
        if (savedTime && savedTime > 5) {
          video.currentTime = savedTime;
        }
      });
    }

    // Wait for the video element to exist (especially important on Rumble)
    function waitForVideoAndLoadTime() {
      const interval = setInterval(() => {
        const video = getVideoElement();
        if (video) {
          clearInterval(interval);
          loadTime();
        }
      }, 1000);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) saveTime();
    });

    window.addEventListener('beforeunload', saveTime);
    window.addEventListener('load', waitForVideoAndLoadTime);
  }

  console.log('Stream Timestamp initialization complete!');
});

// Log that script has finished loading
console.log('Stream Timestamp script loaded!');

*/