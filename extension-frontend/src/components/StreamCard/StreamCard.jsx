import { useState } from 'react';
import PropTypes from 'prop-types';
import './StreamCard.css';


/*
These are the new properties. Proptypes have to be updated to match.
The Stream Cards will show:
- Title of stream
- Channel
- Link to stream
- Delete button that removes it from local and extension storage locations
- date and time of stream start.


Example stream object :
{
  "url": "https://www.youtube.com/watch?v=Fk9NyPZghRE&ab_channel=whatever&sttick=0",
  "videoId": "Fk9NyPZghRE",
  "videoTitle": "Andrew Wilson vs. Naima | Whatever Debates #20",
  "channelName": "",
  "isLive": true,
  "isEnded": false,
  "currentTime": 8226.089581,
  "totalTime": 17016.253,
  "lastSavedTime": 8226.089581,
  "lastSaveTimestamp": 1747707999578,
  "streamStartTime": 1747690589441,
  "streamStartDate": "May 19, 2025, 5:36 PM",
  "streamEndTime": 0,
  "streamEndDate": null,
  "sessionId": "session_1747707605710_4jmq1fmcc",
  "watchHistory": [
    {
      "time": 7823.463239,
      "formattedTime": "2:10:23",
      "timestamp": 1747707606735
    },
    {
      "time": 7824.785084,
      "formattedTime": "2:10:24",
      "timestamp": 1747707608065
    }
    //... rest of timestamps
    ]
}
{

  "url": "https://www.youtube.com/watch?v=rPjez8z61rI&ab_channel=STEEZYASFUCK",
  "videoId": "rPjez8z61rI",
  "videoTitle": "lofi hip hop radio – beats to sleep/study/relax to ☕",
  "channelName": "STEEZYASFUCK",
  "isLive": true,
  "isEnded": false,
  "currentTime": 40173.966618,
  "totalTime": 50405.00906576106,
  "lastSavedTime": 40173.966618,
  "lastSaveTimestamp": 1747693408578,
  "streamStartTime": 1747686770677,
  "streamStartDate": "May 19, 2025, 6:12:50 AM",
  "streamEndTime": 0,
  "streamEndDate": null,
  "sessionId": "session_1747686770677_h85g0aa5v",
  "watchHistory": [
    { 
      formattedTime: "9:18:57",
      time: 33537.062488,
      timestamp: 1747686770693
    },
    {
      formattedTime: "9:18:58",
      time: 33538.280737,
      timestamp: 1747686771911
    }
    ... rest of timestamps
  ]
}
*/

const StreamCard = ({ stream, onDelete, onRefresh, settings }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefresh?.(stream);
    } catch (error) {
      console.error('Error refreshing stream:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(stream);
    } catch (error) {
      console.error('Error deleting stream:', error);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  const getVideoUrlWithTime = (url, time) => {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?t=${Math.floor(time)}`;
  };

  const getThumbnailUrl = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  const DeleteIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4V9H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 20V15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 9M19.95 15L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ExternalLinkIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 13V19C18 19.5304 17.7893 20.0391 17.4142 20.4142C17.0391 20.7893 16.5304 21 16 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V8C3 7.46957 3.21071 6.96086 3.58579 6.58579C3.96086 6.21071 4.46957 6 5 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="stream-card">
      <div className="stream-card-header">
        <div className="thumbnail-container">
          <img 
            src={getThumbnailUrl(stream.videoId)} 
            alt={stream.videoTitle}
            className="video-thumbnail"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://img.youtube.com/vi/default/mqdefault.jpg';
            }}
          />
          {stream.isLive && (
            <div className="live-badge">LIVE</div>
          )}
        </div>
        <div className="stream-info">
          <h3 className="stream-title">
            <a href={stream.url} target="_blank" rel="noopener noreferrer">
              {stream.videoTitle}
            </a>
          </h3>
          {stream.channelName && (
            <div className="channel-name">
              <a 
                href={`https://www.youtube.com/channel/${stream.channelId || ''}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {stream.channelName}
              </a>
            </div>
          )}
          <div className="stream-meta">
            <span className="current-time">
              Current: {stream.currentTime ? Math.floor(stream.currentTime / 60) + ':' + 
                String(Math.floor(stream.currentTime % 60)).padStart(2, '0') : '0:00'}
            </span>
            {stream.streamStartDate && (
              <span className="start-date">
                Started: {stream.streamStartDate}
              </span>
            )}
          </div>
        </div>
        <div className="stream-actions">
          <button 
            className="stream-action-button primary"
            onClick={() => window.open(stream.url, '_blank')}
            title="View on YouTube"
          >
            <ExternalLinkIcon />
            View
          </button>
          <button 
            onClick={handleDelete} 
            className="delete-button"
            title="Delete stream"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      <div className="stream-content">
        <div className="stream-details">
          <div className="stream-status">
            <span className={`status-indicator ${stream.isLive ? 'live' : 'ended'}`}>
              {stream.isLive ? 'Live' : 'Ended'}
            </span>
          </div>
          <div className="stream-times">
            <div className="time-info">
              <span className="time-label">Start Time:</span>
              <a 
                href={getVideoUrlWithTime(stream.url, 0)}
                target="_blank"
                rel="noopener noreferrer"
                className="time-value link"
              >
                {formatDate(stream.streamStartTime)}
              </a>
            </div>
            {stream.isEnded && (
              <div className="time-info">
                <span className="time-label">End Time:</span>
                <a 
                  href={getVideoUrlWithTime(stream.url, stream.totalTime)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="time-value link"
                >
                  {formatDate(stream.streamEndTime)}
                </a>
              </div>
            )}
            <div className="time-info">
              <span className="time-label">Current Time:</span>
              <a 
                href={getVideoUrlWithTime(stream.url, stream.currentTime)}
                target="_blank"
                rel="noopener noreferrer"
                className="time-value link"
              >
                {formatTime(stream.currentTime)}
              </a>
            </div>
            <div className="time-info">
              <span className="time-label">Total Duration:</span>
              <span className="time-value">{formatTime(stream.totalTime)}</span>
            </div>
          </div>
        </div>

        {stream.watchHistory && stream.watchHistory.length > 0 && (
          <div className="watch-history">
            <h4>Last Position</h4>
            <div className="history-list">
              {(() => {
                const lastEntry = stream.watchHistory[stream.watchHistory.length - 1];
                return (
                  <div className="history-entry">
                    <a 
                      href={getVideoUrlWithTime(stream.url, lastEntry.time)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="history-time link"
                    >
                      {lastEntry.formattedTime}
                    </a>
                    <span className="history-timestamp">{formatDate(lastEntry.timestamp)}</span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

StreamCard.propTypes = {
  stream: PropTypes.shape({
    url: PropTypes.string.isRequired,
    videoId: PropTypes.string.isRequired,
    videoTitle: PropTypes.string.isRequired,
    channelName: PropTypes.string,
    isLive: PropTypes.bool,
    isEnded: PropTypes.bool,
    currentTime: PropTypes.number,
    totalTime: PropTypes.number,
    streamStartTime: PropTypes.number,
    streamEndTime: PropTypes.number,
    watchHistory: PropTypes.arrayOf(PropTypes.shape({
      time: PropTypes.number,
      formattedTime: PropTypes.string,
      timestamp: PropTypes.number
    }))
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  settings: PropTypes.object
};

export default StreamCard; 