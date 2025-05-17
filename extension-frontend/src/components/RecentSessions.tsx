import { useState, useEffect } from 'react';
import { Card, Text, Group, Stack, Title, Badge, Accordion, Button } from '@mantine/core';
import type { TimestampStore, SessionStore } from '../types';
import { formatTime, formatDate } from '../utils/formatting';

interface RecentSessionsProps {
  timestamps: TimestampStore;
  onClearTimestamp: (url: string) => void;
}

export function RecentSessions({ timestamps, onClearTimestamp }: RecentSessionsProps) {
  const [sessions, setSessions] = useState<SessionStore>({});

  useEffect(() => {
    // Group timestamps by sessionId
    const groupedSessions: SessionStore = {};
    
    Object.values(timestamps).forEach((timestamp) => {
      if (!timestamp.sessionId) return;
      
      if (!groupedSessions[timestamp.sessionId]) {
        groupedSessions[timestamp.sessionId] = {
          id: timestamp.sessionId,
          startTime: timestamp.lastAccessed,
          videoIds: [timestamp.videoId],
        };
      } else {
        const session = groupedSessions[timestamp.sessionId];
        if (!session.videoIds.includes(timestamp.videoId)) {
          session.videoIds.push(timestamp.videoId);
        }
        // Update session time range
        session.startTime = Math.min(session.startTime, timestamp.lastAccessed);
        session.endTime = Math.max(session.endTime || 0, timestamp.lastAccessed);
      }
    });

    setSessions(groupedSessions);
  }, [timestamps]);

  const sortedSessions = Object.values(sessions).sort((a, b) => b.startTime - a.startTime);

  return (
    <Stack gap="md">
      <Title order={4}>Recent Sessions</Title>
      
      {sortedSessions.length === 0 ? (
        <Text c="dimmed" ta="center">No recent sessions</Text>
      ) : (
        <Accordion>
          {sortedSessions.map((session) => {
            const sessionTimestamps = Object.values(timestamps).filter(
              t => t.sessionId === session.id
            );
            
            return (
              <Accordion.Item key={session.id} value={session.id}>
                <Accordion.Control>
                  <Group justify="space-between">
                    <Text>Session from {formatDate(session.startTime)}</Text>
                    <Badge>{sessionTimestamps.length} timestamps</Badge>
                  </Group>
                </Accordion.Control>
                
                <Accordion.Panel>
                  <Stack gap="xs">
                    {sessionTimestamps.map((timestamp) => (
                      <Card key={timestamp.url} shadow="sm" padding="sm" withBorder>
                        <Text size="sm" fw={500} truncate>
                          {timestamp.title || timestamp.url}
                        </Text>
                        {timestamp.channelName && (
                          <Text size="xs" c="dimmed">
                            {timestamp.channelName}
                          </Text>
                        )}
                        <Group justify="space-between" mt="xs">
                          <Text fw={500}>
                            {formatTime(timestamp.timestamp)}
                          </Text>
                          <Button 
                            variant="light" 
                            color="red" 
                            size="xs"
                            onClick={() => onClearTimestamp(timestamp.url)}
                          >
                            Clear
                          </Button>
                        </Group>
                        <Text size="xs" c="dimmed" mt="xs">
                          Last accessed: {formatDate(timestamp.lastAccessed)}
                        </Text>
                      </Card>
                    ))}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
    </Stack>
  );
} 