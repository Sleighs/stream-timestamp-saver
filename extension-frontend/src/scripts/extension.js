/* global chrome */
/* global browser */

const API = chrome || browser;

// Helper function to check if debug mode is enabled
async function isDebugEnabled() {
  try {
    const result = await API.storage.local.get('settings');
    return result.settings?.debugMode || false;
  } catch {
    return false;
  }
}

// Internal debug logging
async function log(message, ...args) {
  if (await isDebugEnabled()) {
    console.log(`[Stream Timestamp] ${message}`, ...args);
  }
}

async function logError(message, error) {
  if (await isDebugEnabled()) {
    console.error(`[Stream Timestamp] ${message}`, error);
  }
}

// Opens options page
export async function openOptions() {
  if (API.runtime.openOptionsPage) {
    await log('chrome runtime opened options page');
    API.runtime.openOptionsPage();
  } else {
    await log('window opened options page');
    window.open(API.runtime.getURL('options.html'));
  }
}

// Saves options to chrome.storage
export async function saveOptions(data) {
  await API.storage.sync.set({ options: data })
    .then(() => { 
      log('Options saved.'); 
    });
}

// Gets options from chrome.storage
export async function getOptions() {
  let optionsData;
  try {
    await API.storage.sync.get("options")
      .then((result) => { 
        log('Options retrieved.', result.options);
        optionsData = result.options; 
      });
  } catch (error) {
    await logError('Error retrieving options.', error);
  }
  return optionsData;
}

// Get all saved timestamps
export async function getSavedTimestamps() {
  let timestampData = null;

  try {
    await API.storage.local.get(null)
      .then((result) => { 
        log('Timestamps received.', result);
        timestampData = result;
      });
  } catch (error) {
    await logError('Error retrieving timestamps.', error);
  }

  return timestampData;
}

// Save a timestamp for a specific URL
export async function saveTimestamp(url, timestamp) {
  const data = {
    [url]: {
      timestamp,
      lastAccessed: Date.now()
    }
  };

  try {
    await API.storage.local.set(data);
    await log('Timestamp saved:', { url, timestamp });
  } catch (error) {
    await logError('Error saving timestamp:', error);
    throw error;
  }
}

// Clear a specific timestamp
export async function clearTimestamp(url) {
  try {
    await API.storage.local.remove(url);
    await log('Timestamp cleared:', url);
  } catch (error) {
    await logError('Error clearing timestamp:', error);
    throw error;
  }
}

// Clear all timestamps
export async function clearAllTimestamps() {
  try {
    await API.storage.local.clear();
    await log('All timestamps cleared');
  } catch (error) {
    await logError('Error clearing all timestamps:', error);
    throw error;
  }
}

// Update extension icon based on enabled state
export async function updateIcon(enabled) {
  try {
    const iconPath = enabled ? {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    } : {
      "16": "icons/icon-disabled-16.png",
      "32": "icons/icon-disabled-32.png",
      "48": "icons/icon-disabled-48.png",
      "128": "icons/icon-disabled-128.png"
    };

    await API.action.setIcon({ path: iconPath });
    await log('Extension icon updated:', enabled ? 'enabled' : 'disabled');
  } catch (error) {
    await logError('Error updating icon:', error);
  }
}