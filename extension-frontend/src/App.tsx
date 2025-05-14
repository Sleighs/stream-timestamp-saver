import { useEffect, useState } from 'react';
import { MantineProvider, Container, Title, Text, Button, Stack, Card, Group, Alert, Switch } from '@mantine/core';
import type { TimestampStore } from './types';
import { useSettings } from './contexts/SettingsContext';
import { updateIcon, clearTimestamp as clearTimestampExt, clearAllTimestamps as clearAllTimestampsExt } from './scripts/extension';

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

function App() {
  const { settings, updateSetting, showNotification } = useSettings();
  const [timestamps, setTimestamps] = useState<TimestampStore>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [pendingOperations, setPendingOperations] = useState<Array<{
    type: 'remove' | 'clear';
    url?: string;
  }>>([]);

  useEffect(() => {
    // Check if we're in a Chrome extension environment
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      setError('Not in Chrome extension environment. Storage API not available.');
      return;
    }

    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
      // Process pending operations
      pendingOperations.forEach(op => {
        if (op.type === 'remove' && op.url) {
          clearTimestamp(op.url);
        } else if (op.type === 'clear') {
          clearAllTimestamps();
        }
      });
      setPendingOperations([]);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load all timestamps
    const loadTimestamps = async () => {
      try {
        const result = await chrome.storage.local.get(null);
        setTimestamps(result as TimestampStore);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load timestamps: ${errorMessage}`);
      }
    };

    loadTimestamps();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingOperations]);

  const toggleDebugMode = async () => {
    try {
      await updateSetting('debugMode', !settings.debugMode);
      showNotification(`Debug mode ${settings.debugMode ? 'disabled' : 'enabled'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to toggle debug mode: ${errorMessage}`);
    }
  };

  const toggleExtension = async () => {
    try {
      await updateSetting('extensionEnabled', !settings.extensionEnabled);
      await updateIcon(!settings.extensionEnabled);
      showNotification(`Extension ${settings.extensionEnabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to toggle extension: ${errorMessage}`);
    }
  };

  const clearTimestamp = async (url: string) => {
    if (!isOnline) {
      setPendingOperations(prev => [...prev, { type: 'remove', url }]);
      // Optimistically update UI
      const newTimestamps = { ...timestamps };
      delete newTimestamps[url];
      setTimestamps(newTimestamps);
      return;
    }

    try {
      await clearTimestampExt(url);
      const newTimestamps = { ...timestamps };
      delete newTimestamps[url];
      setTimestamps(newTimestamps);
      showNotification('Timestamp cleared successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to clear timestamp: ${errorMessage}`);
    }
  };

  const clearAllTimestamps = async () => {
    if (!isOnline) {
      setPendingOperations(prev => [...prev, { type: 'clear' }]);
      // Optimistically update UI
      setTimestamps({});
      return;
    }

    try {
      await clearAllTimestampsExt();
      setTimestamps({});
      showNotification('All timestamps cleared successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to clear all timestamps: ${errorMessage}`);
    }
  };

  return (
    <MantineProvider>
      <Container p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={3}>Stream Timestamp Saver</Title>
            <Group>
              <Switch
                label="Extension Enabled"
                checked={settings.extensionEnabled}
                onChange={toggleExtension}
                size="sm"
              />
              <Switch
                label="Debug Mode"
                checked={settings.debugMode}
                onChange={toggleDebugMode}
                size="sm"
              />
            </Group>
          </Group>

          {!isOnline && (
            <Alert color="yellow" title="Offline Mode">
              You are currently offline. Changes will be applied when you reconnect.
              {pendingOperations.length > 0 && (
                <Text size="sm" mt="xs">
                  Pending changes: {pendingOperations.length}
                </Text>
              )}
            </Alert>
          )}

          {error && (
            <Alert color="red" title="Error" onClose={() => setError(null)} withCloseButton>
              {error}
            </Alert>
          )}
          
          {Object.entries(timestamps).map(([url, data]) => (
            <Card key={url} shadow="sm" padding="sm" withBorder>
              <Text size="sm" c="dimmed" truncate>
                {url}
              </Text>
              <Group justify="space-between" mt="xs">
                <Text fw={500}>
                  {formatTime(data.timestamp)}
                </Text>
                <Button 
                  variant="light" 
                  color="red" 
                  size="xs"
                  onClick={() => clearTimestamp(url)}
                >
                  Clear
                </Button>
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                Last accessed: {formatDate(data.lastAccessed)}
              </Text>
            </Card>
          ))}

          {Object.keys(timestamps).length === 0 && (
            <Text c="dimmed" ta="center">
              No saved timestamps yet
            </Text>
          )}

          {Object.keys(timestamps).length > 0 && (
            <Button 
              color="red" 
              variant="outline"
              onClick={clearAllTimestamps}
            >
              Clear All Timestamps
            </Button>
          )}
        </Stack>
      </Container>
    </MantineProvider>
  );
}

export default App;
