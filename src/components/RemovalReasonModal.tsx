import { useState, useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';

const companyBadgeColor = (name: string): string => {
  const colors = [
    'bg-blue-900', 'bg-orange-600', 'bg-emerald-700',
    'bg-purple-700', 'bg-rose-700', 'bg-slate-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

interface RemovalReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  jobTitle: string;
  companyName: string;
}

export default function RemovalReasonModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  jobTitle,
  companyName 
}: RemovalReasonModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setIsSubmitting(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } catch (error) {
      console.error('Error submitting removal reason:', error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      setReason('');
      onClose();
    }
  };

  if (!isOpen) return null;

  const companyLabel = companyName?.trim() || '?';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="removal-reason-title"
      aria-describedby="removal-reason-description"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl">
        {/* Close button */}
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 shadow-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="px-7 pt-7 pb-4 border-b border-gray-100">
          <h2
            id="removal-reason-title"
            className="flex items-center gap-2 text-[26px] leading-tight font-semibold text-gray-600"
          >
            Remove Job Card
            <Trash2 className="w-5 h-5 text-gray-500" />
          </h2>
          <p className="text-base text-gray-800 mt-1">Please provide a reason</p>
        </div>

        {/* Content */}
        <div className="p-7">
          <div className="border border-gray-300 rounded-2xl p-5 mb-7">
            <p className="text-xl font-bold text-gray-900 mb-6">{jobTitle}</p>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-lg ${companyBadgeColor(companyName)} text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0 px-1.5 text-center leading-tight break-words`}>
                {companyLabel}
              </div>
              <span className="text-lg text-gray-600 font-medium">{companyName}</span>
            </div>
          </div>

          <label
            htmlFor="removal-reason-textarea"
            className="block text-lg font-medium text-gray-600 mb-3"
          >
            Reason for Removal<span className="text-red-500">*</span>
          </label>
          <textarea
            id="removal-reason-textarea"
            ref={textareaRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for  moving this job card to removed."
            rows={4}
            disabled={isSubmitting}
            className="w-full px-5 py-4 bg-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed resize-none transition-all placeholder:text-gray-500"
            aria-required="true"
            aria-describedby="removal-reason-description"
          />
          <p
            id="removal-reason-description"
            className="mt-5 text-sm text-center text-gray-500 border border-orange-200 rounded-xl py-3"
          >
            This Information will be sent to the operations teams.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 text-gray-500 px-4 py-4 rounded-2xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
              className="flex-1 bg-orange-600 text-white px-4 py-4 rounded-2xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {isSubmitting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

