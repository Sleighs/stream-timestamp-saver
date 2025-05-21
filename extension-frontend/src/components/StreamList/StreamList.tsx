import React from 'react';
import { Settings } from '../../contexts/SettingsContext';
import './StreamList.css';

interface Stream {
  url: string;
  [key: string]: any;
}

interface StreamListProps {
  onRefresh: () => Promise<void>;
  settings: Settings;
  error: string | null;
}

const StreamList: React.FC<StreamListProps> = ({ onRefresh, settings, error }) => {
  return (
    <div className="stream-list">
      {error && <div className="error">{error}</div>}
      <button onClick={onRefresh}>Refresh</button>
      <div className="streams">
        {/* Stream list will be implemented here */}
      </div>
    </div>
  );
};

export default StreamList; 