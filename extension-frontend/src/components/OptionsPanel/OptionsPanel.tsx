import React from 'react';
import { Settings } from '../../contexts/SettingsContext';
import './OptionsPanel.css';

interface OptionsPanelProps {
  settings: Settings;
  onSettingChange: (newSettings: Partial<Settings>) => Promise<Settings>;
}

const OptionsPanel: React.FC<OptionsPanelProps> = ({ settings, onSettingChange }) => {
  const handleToggle = async (key: keyof Settings) => {
    await onSettingChange({ [key]: !settings[key] });
  };

  return (
    <div className="options-panel">
      <div className="option">
        <label>Extension Enabled</label>
        <button onClick={() => handleToggle('extensionEnabled')}>
          {settings.extensionEnabled ? 'Disable' : 'Enable'}
        </button>
      </div>
      {/* More options will be added here */}
    </div>
  );
};

export default OptionsPanel; 