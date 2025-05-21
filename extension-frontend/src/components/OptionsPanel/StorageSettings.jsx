/* global chrome */
import { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import './OptionsPanel.css';

const StorageSettings = () => {
  const { settings, updateSetting } = useSettings();
  const [browserStorageType, setBrowserStorageType] = useState(settings?.browserStorageType ?? 'local');
  const [maxTimestamps, setMaxTimestamps] = useState(settings?.maxTimestamps ?? 1000);
  const [autoCleanup, setAutoCleanup] = useState(settings?.autoCleanup ?? false);
  const [cleanupThreshold, setCleanupThreshold] = useState(settings?.cleanupThreshold ?? 900);
  const [backupEnabled, setBackupEnabled] = useState(settings?.backupEnabled ?? false);
  const [backupFrequency, setBackupFrequency] = useState(settings?.backupFrequency ?? 'weekly');
  const [exportFormat, setExportFormat] = useState('json');

  useEffect(() => {
    if (settings) {
      setBrowserStorageType(settings.browserStorageType ?? 'local');
      setMaxTimestamps(settings.maxTimestamps ?? 1000);
      setAutoCleanup(settings.autoCleanup ?? false);
      setCleanupThreshold(settings.cleanupThreshold ?? 900);
      setBackupEnabled(settings.backupEnabled ?? false);
      setBackupFrequency(settings.backupFrequency ?? 'weekly');
    }
  }, [settings]);

  const handleSettingChange = async (key, value) => {
    try {
      await updateSetting(key, value);
      if (window.showNotification) {
        window.showNotification('Settings updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      if (window.showNotification) {
        window.showNotification('Error updating settings', 'error');
      }
    }
  };

  const handleStorageTypeChange = (e) => {
    const value = e.target.value;
    setBrowserStorageType(value);
    handleSettingChange('browserStorageType', value);
  };

  const handleMaxTimestampsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMaxTimestamps(value);
      handleSettingChange('maxTimestamps', value);
    }
  };

  const handleAutoCleanupChange = (e) => {
    const value = e.target.checked;
    setAutoCleanup(value);
    handleSettingChange('autoCleanup', value);
  };

  const handleCleanupThresholdChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setCleanupThreshold(value);
      handleSettingChange('cleanupThreshold', value);
    }
  };

  const handleBackupEnabledChange = (e) => {
    const value = e.target.checked;
    setBackupEnabled(value);
    handleSettingChange('backupEnabled', value);
  };

  const handleBackupFrequencyChange = (e) => {
    const value = e.target.value;
    setBackupFrequency(value);
    handleSettingChange('backupFrequency', value);
  };

  const handleFormatChange = (e) => {
    setExportFormat(e.target.value);
  };

  const handleExportData = async () => {
    try {
      const [localResult, syncResult] = await Promise.all([
        chrome.storage.local.get('tweets'),
        chrome.storage.sync.get('tweets')
      ]);

      const localTweets = localResult.tweets ? JSON.parse(localResult.tweets) : [];
      const syncTweets = syncResult.tweets ? JSON.parse(syncResult.tweets) : [];

      const allTweets = [...localTweets, ...syncTweets];
      const uniqueTweets = Array.from(
        new Map(allTweets.map(tweet => [tweet.url, tweet])).values()
      );

      let exportContent;
      let mimeType;
      let fileExtension;

      switch (exportFormat) {
        case 'json':
          exportContent = JSON.stringify(uniqueTweets, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        case 'text':
          exportContent = uniqueTweets.map(tweet => {
            const tweetDate = new Date(tweet.timestamp).toLocaleString();
            const saveDate = new Date(tweet.savedAt).toLocaleString();
            return `Tweet by @${tweet.username}
  ${tweet.text}
  URL: ${tweet.url}
  Posted: ${tweetDate}
  Saved: ${saveDate}
  Storage: ${tweet.storageType}
  Likes: ${tweet.likes ? tweet.likes : 'N/A'}
  Retweets: ${tweet.retweets ? tweet.retweets : 'N/A'}
  Replies: ${tweet.replies ? tweet.replies : 'N/A'}
  Media: ${tweet.media ? tweet.media.length : 0} items
  ${'-'.repeat(3)}`;
          }).join('\n\n');
          mimeType = 'text/plain';
          fileExtension = 'txt';
          break;
        case 'markdown':
          exportContent = uniqueTweets.map(tweet => {
            const tweetDate = new Date(tweet.timestamp).toLocaleString();
            const saveDate = new Date(tweet.savedAt).toLocaleString();
            return `### Tweet by @${tweet.username}
${tweet.text}        
* **URL:** ${tweet.url}
* **Posted:** ${tweetDate}
* **Saved:** ${saveDate}
* **Storage:** ${tweet.storageType}
* **Likes:** ${tweet.likes? tweet.likes : 'N/A'}
* **Retweets:** ${tweet.retweets ? tweet.retweets : 'N/A'}
* **Replies:** ${tweet.replies ? tweet.replies : 'N/A'}
* **Media:** ${tweet.media ? tweet.media.length : 0} items
***`;
          }).join('\n\n');
          mimeType = 'text/markdown';
          fileExtension = 'md';
          break;
        default:
          exportContent = JSON.stringify(uniqueTweets, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
      }

      const blob = new Blob([exportContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `post-saver-export-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.showNotification) {
        window.showNotification('Posts exported successfully', 'success');
      }
    } catch (error) {
      console.error('Error exporting posts:', error);
      if (window.showNotification) {
        window.showNotification('Error exporting posts', 'error');
      }
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const [localResult, syncResult] = await Promise.all([
        chrome.storage.local.get('tweets'),
        chrome.storage.sync.get('tweets')
      ]);

      const localTweets = localResult.tweets ? JSON.parse(localResult.tweets) : [];
      const syncTweets = syncResult.tweets ? JSON.parse(syncResult.tweets) : [];

      const allTweets = [...localTweets, ...syncTweets];
      const uniqueTweets = Array.from(
        new Map(allTweets.map(tweet => [tweet.url, tweet])).values()
      );

      const formattedText = uniqueTweets.map(tweet => {
        const tweetDate = new Date(tweet.timestamp).toLocaleString();
        const saveDate = new Date(tweet.savedAt).toLocaleString();
        
        return `Tweet by @${tweet.username}
  ${tweet.text}
  URL: ${tweet.url}
  Posted: ${tweetDate}
  Saved: ${saveDate}
  Storage: ${tweet.storageType}
  Likes: ${tweet.likes ? tweet.likes : `N/A`}
  Retweets: ${tweet.retweets ? tweet.retweets : `N/A`}
  Replies: ${tweet.replies ? tweet.replies : `N/A`}
  Media: ${tweet.media ? tweet.media.length : 0} items
          ${'-'.repeat(3)}`;
      }).join('\n\n');

      const formattedTextJSON = JSON.stringify(uniqueTweets, null, 2);

      const formattedTextMarkdown = uniqueTweets.map(tweet => {
        const tweetDate = new Date(tweet.timestamp).toLocaleString();
        const saveDate = new Date(tweet.savedAt).toLocaleString();

        return `### Tweet by @${tweet.username} 
${tweet.text}
* URL: ${tweet.url}
* Posted: ${tweetDate}
* Saved: ${saveDate}
* Storage: ${tweet.storageType}
* Likes: ${tweet.likes ? tweet.likes : `N/A`}
* Retweets: ${tweet.retweets ? tweet.retweets : `N/A`}
* Replies: ${tweet.replies ? tweet.replies : `N/A`}
* Media: ${tweet.media ? tweet.media.length : 0} items
\n***\n`;
      }).join('\n\n');

      switch (exportFormat) {
        case 'json':
          await navigator.clipboard.writeText(formattedTextJSON);
          break;
        case 'text':
          await navigator.clipboard.writeText(formattedText);
          break;
        case 'markdown':
          await navigator.clipboard.writeText(formattedTextMarkdown);
          break;
        default:
          await navigator.clipboard.writeText(formattedTextJSON);
          break;
      }
      
      if (window.showNotification) {
        window.showNotification('Posts copied to clipboard', 'success');
      }
    } catch (error) {
      console.error('Error copying tweets:', error);
      if (window.showNotification) {
        window.showNotification('Error copying posts to clipboard', 'error');
      }
    }
  };

  const handleClearData = async () => {
    if (window.confirm("Are you sure you want to clear all extension data? This cannot be undone.")) {
      try {
        await chrome.storage.local.clear();
        await chrome.storage.sync.clear();
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'ALL_TWEETS_DELETED' });
          }
        });

        // Remove data from localstorage
        localStorage.remove('tweet-saver--tweets');
        localStorage.remove('tweet-saver--urls');
        localStorage.remove('tweet-saver--settings');
        
        if (window.showNotification) {
          window.showNotification('All data cleared successfully', 'success');
        }
      } catch (error) {
        console.error('Error clearing data:', error);
        if (window.showNotification) {
          window.showNotification('Error clearing data', 'error');
        }
      }
    }
  };

  if (!settings) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-section">
      <h2>Storage Settings</h2>

      <div className="setting-group">
        <label className="setting-label">
          <span>Storage Type</span>
          <select value={browserStorageType} onChange={handleStorageTypeChange}>
            <option value="local">Local Storage</option>
            <option value="sync">Sync Storage</option>
          </select>
        </label>
        <p className="setting-description">
          Choose where to store timestamps (local or sync across devices)
        </p>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>Maximum Timestamps</span>
          <input
            type="number"
            min="100"
            max="10000"
            value={maxTimestamps}
            onChange={handleMaxTimestampsChange}
          />
        </label>
        <p className="setting-description">
          Maximum number of timestamps to store (100-10000)
        </p>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>Auto Cleanup</span>
          <input
            type="checkbox"
            checked={autoCleanup}
            onChange={handleAutoCleanupChange}
          />
        </label>
        <p className="setting-description">
          Automatically remove oldest timestamps when storage limit is reached
        </p>
      </div>

      {autoCleanup && (
        <div className="setting-group">
          <label className="setting-label">
            <span>Cleanup Threshold (%)</span>
            <input
              type="number"
              min="50"
              max="100"
              value={cleanupThreshold}
              onChange={handleCleanupThresholdChange}
            />
          </label>
          <p className="setting-description">
            Start cleanup when storage reaches this percentage (50-100%)
          </p>
        </div>
      )}

      <div className="setting-group">
        <h3>Export Options</h3>
        <div className="export-format">
          <label className="setting-label">
            <span>Format</span>
            <select 
              value={exportFormat}
              onChange={handleFormatChange}
              className="format-select"
            >
              <option value="json">JSON</option>
              <option value="text">Plain Text</option>
              <option value="markdown">Markdown</option>
            </select>
          </label>
        </div>
        <div className="export-buttons">
          <button onClick={handleExportData} className="export-button">
            <span className="button-icon">📥</span>
            Export to File
          </button>
          <button onClick={handleCopyToClipboard} className="export-button">
            <span className="button-icon">📋</span>
            Copy to Clipboard
          </button>
        </div>
        <p className="setting-description">
          Export your saved posts as a file or copy them to clipboard in your preferred format
        </p>
      </div>

      <div className="setting-group danger-zone">
        <h3>Danger Zone</h3>
        <button 
          className="action-button danger"
          onClick={handleClearData}
        >
          Clear All Data
        </button>
        <p className="setting-description">
          Delete all saved tweets
        </p>
      </div>
    </div>
  );
};

export default StorageSettings;