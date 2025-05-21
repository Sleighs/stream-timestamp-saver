import { Settings } from '../../contexts/SettingsContext';

interface StreamListProps {
  onRefresh: () => Promise<void>;
  settings: Settings;
  error: string | null;
}

declare const StreamList: React.FC<StreamListProps>;
export default StreamList; 