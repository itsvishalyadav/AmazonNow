import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface FeedbackToastProps {
  message: string;
  type: 'avoid' | 'prefer';
  onDismiss: () => void;
}

export default function FeedbackToast({ message, type, onDismiss }: FeedbackToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`feedback-toast feedback-toast--${type}`}>
      <CheckCircle2 size={16} className={`feedback-icon--${type}`} />
      <span className="feedback-message">{message}</span>
    </div>
  );
}
