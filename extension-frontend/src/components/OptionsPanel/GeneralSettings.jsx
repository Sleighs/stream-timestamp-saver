import { useState, useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import './OptionsPanel.css';

const GeneralSettings = () => {
  const { settings, updateSetting } = useSettings();
  
  // Core functionality settings
  const [enableExtension, setEnableExtension] = useState(settings?.enableExtension ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings?.notificationsEnabled ?? true);
  const [autoSave, setAutoSave] = useState(settings?.autoSave ?? true);
  const [autoSaveNonLive, setAutoSaveNonLive] = useState(settings?.autoSaveNonLive ?? false);
  const [saveInterval, setSaveInterval] = useState(settings?.saveInterval ?? 4000);
  const [saveDelay, setSaveDelay] = useState(settings?.saveDelay ?? 500);
  const [enableLikeDislikeChecker, setEnableLikeDislikeChecker] = useState(settings?.enableLikeDislikeChecker ?? true);

  useEffect(() => {
    if (settings) {
      setEnableExtension(settings.enableExtension ?? true);
      setNotificationsEnabled(settings.notificationsEnabled ?? true);
      setAutoSave(settings.autoSave ?? true);
      setAutoSaveNonLive(settings.autoSaveNonLive ?? false);
      setSaveInterval(settings.saveInterval ?? 4000);
      setSaveDelay(settings.saveDelay ?? 500);
      setEnableLikeDislikeChecker(settings.enableLikeDislikeChecker ?? true);
    }
  }, [settings]);

  const handleSettingChange = async (key, value) => {
    try {
      await updateSetting(key, value);
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (activeTab?.url?.includes('youtube.com')) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'SETTING_UPDATED',
          payload: {
            key,
            value,
            notify: settings?.notificationsEnabled ?? true
          }
        }).catch(() => {
          // Ignore errors for inactive tabs
        });
      }

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

  const handleEnableExtensionChange = (e) => {
    const value = e.target.checked;
    setEnableExtension(value);
    handleSettingChange('enableExtension', value);
  };

  const handleNotificationsChange = (e) => {
    const value = e.target.checked;
    setNotificationsEnabled(value);
    handleSettingChange('notificationsEnabled', value);
  };

  const handleAutoSaveChange = (e) => {
    const value = e.target.checked;
    setAutoSave(value);
    handleSettingChange('autoSave', value);
  };

  const handleAutoSaveNonLiveChange = (e) => {
    const value = e.target.checked;
    setAutoSaveNonLive(value);
    handleSettingChange('autoSaveNonLive', value);
  };

  const handleSaveIntervalChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1000) {
      setSaveInterval(value);
      handleSettingChange('saveInterval', value);
    }
  };

  const handleSaveDelayChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setSaveDelay(value);
      handleSettingChange('saveDelay', value);
    }
  };

  const handleLikeDislikeCheckerChange = (e) => {
    const value = e.target.checked;
    setEnableLikeDislikeChecker(value);
    handleSettingChange('enableLikeDislikeChecker', value);
  };

  if (!settings) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-section">
      <h2>General Settings</h2>

      <div className="setting-group">
        <label className="setting-label">
          <span>Enable Extension</span>
          <input
            type="checkbox"
            checked={enableExtension}
            onChange={handleEnableExtensionChange}
          />
        </label>
        <p className="setting-description">
          Enable or disable the Stream Timestamp Saver extension
        </p>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>Show Notifications</span>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={handleNotificationsChange}
          />
        </label>
        <p className="setting-description">
          Display notifications when timestamps are saved
        </p>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>Auto-save Timestamps</span>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={handleAutoSaveChange}
          />
        </label>
        <p className="setting-description">
          Automatically save timestamps while watching videos
        </p>
      </div>

      {autoSave && (
        <>
          <div className="setting-group">
            <label className="setting-label">
              <span>Auto-save Non-live Videos</span>
              <input
                type="checkbox"
                checked={autoSaveNonLive}
                onChange={handleAutoSaveNonLiveChange}
              />
            </label>
            <p className="setting-description">
              Also auto-save timestamps for non-live videos
            </p>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              <span>Save Interval (ms)</span>
              <input
                type="number"
                min="1000"
                max="10000"
                value={saveInterval}
                onChange={handleSaveIntervalChange}
              />
            </label>
            <p className="setting-description">
              How often to save timestamps (1000-10000 milliseconds)
            </p>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              <span>Save Delay (ms)</span>
              <input
                type="number"
                min="0"
                max="5000"
                value={saveDelay}
                onChange={handleSaveDelayChange}
              />
            </label>
            <p className="setting-description">
              Delay before auto-saving (0-5000 milliseconds)
            </p>
          </div>
        </>
      )}

      <div className="setting-group">
        <label className="setting-label">
          <span>Enable Like/Dislike Checker</span>
          <input
            type="checkbox"
            checked={enableLikeDislikeChecker}
            onChange={handleLikeDislikeCheckerChange}
          />
        </label>
        <p className="setting-description">
          Show like and dislike counts for YouTube videos (uses external API)
        </p>
      </div>
    </div>
  );
};

export default GeneralSettings;