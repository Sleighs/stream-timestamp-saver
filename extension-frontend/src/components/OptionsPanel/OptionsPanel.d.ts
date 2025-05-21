import { Settings } from '../../contexts/SettingsContext';

interface OptionsPanelProps {
  settings: Settings;
  onSettingChange: (newSettings: Partial<Settings>) => Promise<Settings>;
}

declare const OptionsPanel: React.FC<OptionsPanelProps>;
export default OptionsPanel; 