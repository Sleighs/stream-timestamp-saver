import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import StreamCard from '../StreamCard/StreamCard';
// import { sampleData } from '../../scripts/sampleData';
import './StreamList.css';

// Sample data for development environment
const SAMPLE_STREAMS = [
  {
    url: "https://www.youtube.com/watch?v=Fk9NyPZghRE",
    videoId: "Fk9NyPZghRE",
    videoTitle: "Andrew Wilson vs. Naima | Whatever Debates #20",
    channelName: "Whatever",
    isLive: true,
    isEnded: false,
    currentTime: 8226.089581,
    totalTime: 17016.253,
    lastSavedTime: 8226.089581,
    lastSaveTimestamp: 1747707999578,
    streamStartTime: 1747690589441,
    streamStartDate: "May 19, 2025, 5:36 PM",
    streamEndTime: 0,
    streamEndDate: null,
    sessionId: "session_1747707605710_4jmq1fmcc",
    watchHistory: [
      {
        time: 7823.463239,
        formattedTime: "2:10:23",
        timestamp: 1747707606735
      },
      {
        time: 7824.785084,
        formattedTime: "2:10:24",
        timestamp: 1747707608065
      }
    ]
  },
  {
    url: "https://www.youtube.com/watch?v=rPjez8z61rI",
    videoId: "rPjez8z61rI",
    videoTitle: "lofi hip hop radio – beats to sleep/study/relax to ☕",
    channelName: "STEEZYASFUCK",
    isLive: true,
    isEnded: false,
    currentTime: 40173.966618,
    totalTime: 50405.00906576106,
    lastSavedTime: 40173.966618,
    lastSaveTimestamp: 1747693408578,
    streamStartTime: 1747686770677,
    streamStartDate: "May 19, 2025, 6:12:50 AM",
    streamEndTime: 0,
    streamEndDate: null,
    sessionId: "session_1747686770677_h85g0aa5v",
    watchHistory: [
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
    ]
  }
];

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

const StreamList = ({ streams, onDeleteStream, onRefresh, settings = {} }) => {
  const [allStreams, setAllStreams] = useState([]);
  const [sortBy, setSortBy] = useState('streamStartTime');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);

  // Check if we're in development environment
  useEffect(() => {
    const isDev = !chrome?.storage || process.env.NODE_ENV === 'development';
    setIsDevelopment(isDev);
    if (isDev) {
      console.log('Running in development mode, using sample data');
      setAllStreams(SAMPLE_STREAMS);
    }
  }, []);

  // Function to get streams from all storage sources
  const getAllStreams = async () => {
    try {
      // If in development, use sample data
      if (isDevelopment) {
        console.log('Using sample data in development mode');
        setAllStreams(SAMPLE_STREAMS);
        return;
      }

      if (!navigator.onLine || !chrome?.storage) {
        console.warn('You are offline. Using localStorage data.');
        const localStorageData = localStorage.getItem('stream-timestamp-saver--timestamps');
        if (localStorageData) {
          const parsedData = JSON.parse(localStorageData);
          const streams = Object.entries(parsedData)
            .filter(([key]) => key.startsWith('timestamp-'))
            .map(([key, value]) => ({
              ...value,
              videoId: key.replace('timestamp-', ''),
              url: `https://www.youtube.com/watch?v=${key.replace('timestamp-', '')}`
            }));
          setAllStreams(streams);
        }
        return;
      }

      // Get streams from all storage sources
      const [chromeLocal, chromeSync, localStorageData] = await Promise.all([
        new Promise((resolve) => {
          chrome.storage.local.get(null, (result) => {
            const streams = Object.entries(result)
              .filter(([key]) => key.startsWith('timestamp-'))
              .map(([key, value]) => ({
                ...value,
                videoId: key.replace('timestamp-', ''),
                url: `https://www.youtube.com/watch?v=${key.replace('timestamp-', '')}`
              }));
            resolve(streams);
          });
        }),
        new Promise((resolve) => {
          chrome.storage.sync.get(null, (result) => {
            const streams = Object.entries(result)
              .filter(([key]) => key.startsWith('timestamp-'))
              .map(([key, value]) => ({
                ...value,
                videoId: key.replace('timestamp-', ''),
                url: `https://www.youtube.com/watch?v=${key.replace('timestamp-', '')}`
              }));
            resolve(streams);
          });
        }),
        new Promise((resolve) => {
          try {
            const data = localStorage.getItem('stream-timestamp-saver--timestamps');
            const parsedData = JSON.parse(data || '{}');
            const streams = Object.entries(parsedData)
              .filter(([key]) => key.startsWith('timestamp-'))
              .map(([key, value]) => ({
                ...value,
                videoId: key.replace('timestamp-', ''),
                url: `https://www.youtube.com/watch?v=${key.replace('timestamp-', '')}`
              }));
            resolve(streams);
          } catch (e) {
            console.error('Error reading localStorage:', e);
            resolve([]);
          }
        })
      ]);

      // Combine all streams and deduplicate based on URL
      const allStreams = [...chromeLocal, ...chromeSync, ...localStorageData];
      const uniqueStreams = Array.from(
        new Map(allStreams.map(stream => [stream.url, stream])).values()
      );

      setAllStreams(uniqueStreams);

    } catch (error) {
      console.error('Error fetching streams:', error);
      // If there's an error and we're in development, fall back to sample data
      if (isDevelopment) {
        setAllStreams(SAMPLE_STREAMS);
      }
    }
  };

  // Fetch streams when component mounts and when streams prop changes
  useEffect(() => {
    getAllStreams();
  }, [streams, isDevelopment]);

  // Get unique channels from streams
  const channels = useMemo(() => {
    const uniqueChannels = new Set(allStreams.map(stream => stream.channelName));
    return Array.from(uniqueChannels).filter(Boolean).sort();
  }, [allStreams]);

  // Filter and sort streams
  const filteredAndSortedStreams = useMemo(() => {
    return [...allStreams]
      .filter(stream => {
        // Filter by type
        if (filterType === 'live' && !stream.isLive) {
          return false;
        }
        if (filterType === 'ended' && !stream.isEnded) {
          return false;
        }

        // Filter by channel
        if (selectedChannel && stream.channelName !== selectedChannel) {
          return false;
        }

        // Filter by search query
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          return (
            stream.videoTitle?.toLowerCase().includes(searchLower) ||
            stream.channelName?.toLowerCase().includes(searchLower)
          );
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'streamStartTime':
            comparison = (b.streamStartTime || 0) - (a.streamStartTime || 0);
            break;
          case 'lastSavedTime':
            comparison = (b.lastSavedTime || 0) - (a.lastSavedTime || 0);
            break;
          case 'currentTime':
            comparison = (b.currentTime || 0) - (a.currentTime || 0);
            break;
          case 'channelName':
            comparison = (a.channelName || '').localeCompare(b.channelName || '');
            break;
          default:
            comparison = (b.streamStartTime || 0) - (a.streamStartTime || 0);
        }
        return sortOrder === 'desc' ? comparison : -comparison;
      });
  }, [allStreams, sortBy, sortOrder, filterType, searchQuery, selectedChannel]);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await getAllStreams();
      await onRefresh?.();
    } catch (err) {
      console.error('Error refreshing streams:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="stream-list-container">
      {isDevelopment && (
        <div className="development-notice">
          Running in development mode with sample data
        </div>
      )}
      <div className="stream-list-controls">
        <div className="search-and-filter">
          <input
            type="text"
            placeholder="Search streams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Streams</option>
            <option value="live">Live Only</option>
            <option value="ended">Ended Only</option>
          </select>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="user-select"
          >
            <option value="">All Channels</option>
            {channels.map(channel => (
              <option key={channel} value={channel}>{channel}</option>
            ))}
          </select>
          <button 
            className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            title="Refresh streams"
          >
            {isRefreshing ? '⟳' : '↻'}
          </button>
        </div>
        <div className="sort-controls">
          <button
            className={`sort-button ${sortBy === 'streamStartTime' ? 'active' : ''}`}
            onClick={() => handleSortChange('streamStartTime')}
          >
            Start Time {sortBy === 'streamStartTime' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-button ${sortBy === 'lastSavedTime' ? 'active' : ''}`}
            onClick={() => handleSortChange('lastSavedTime')}
          >
            Last Saved {sortBy === 'lastSavedTime' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-button ${sortBy === 'currentTime' ? 'active' : ''}`}
            onClick={() => handleSortChange('currentTime')}
          >
            Current Time {sortBy === 'currentTime' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            className={`sort-button ${sortBy === 'channelName' ? 'active' : ''}`}
            onClick={() => handleSortChange('channelName')}
          >
            Channel {sortBy === 'channelName' && (sortOrder === 'desc' ? 'A-Z ↓' : 'Z-A ↑')}
          </button>
        </div>
      </div>

      <div className="streams-stats">
        Showing {filteredAndSortedStreams.length} of {allStreams.length} streams
      </div>

      <div className="stream-list">
        {filteredAndSortedStreams.length === 0 ? (
          <div className="no-streams-message">
            No streams found. Try adjusting your filters or search query.
          </div>
        ) : (
          filteredAndSortedStreams.map(stream => (
            <StreamCard
              key={stream.url}
              stream={stream}
              onDelete={onDeleteStream}
              onRefresh={onRefresh}
              settings={settings}
            />
          ))
        )}
      </div>
    </div>
  );
};

StreamList.propTypes = {
  streams: PropTypes.array,
  onDeleteStream: PropTypes.func,
  onRefresh: PropTypes.func,
  settings: PropTypes.object
};

export default StreamList;