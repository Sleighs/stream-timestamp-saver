import { Alert } from '@mantine/core';
import { useEffect } from 'react';

interface NotificationProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

const Notification = ({ message, onClose, duration = 3000 }: NotificationProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <Alert
      title="Notification"
      color="blue"
      onClose={onClose}
      withCloseButton
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        maxWidth: '300px'
      }}
    >
      {message}
    </Alert>
  );
};

export default Notification; 