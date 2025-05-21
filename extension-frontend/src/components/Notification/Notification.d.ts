interface NotificationProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

declare const Notification: React.FC<NotificationProps>;

export default Notification; 