import { useState, useEffect, useRef } from 'react';
import { XCircle, AlertCircle } from 'lucide-react';

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="removal-reason-title"
      aria-describedby="removal-reason-description"
    >
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 
                id="removal-reason-title"
                className="text-lg font-semibold text-gray-900"
              >
                Remove Job Card
              </h2>
              <p className="text-sm text-gray-500">Please provide a reason</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Job:</span> {jobTitle}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Company:</span> {companyName}
              </p>
            </div>
            
            <label 
              htmlFor="removal-reason-textarea"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Reason for removal <span className="text-red-500">*</span>
            </label>
            <textarea
              id="removal-reason-textarea"
              ref={textareaRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for moving this job card to removed..."
              rows={4}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none transition-all"
              aria-required="true"
              aria-describedby="removal-reason-description"
            />
            <p 
              id="removal-reason-description"
              className="mt-2 text-xs text-gray-500"
            >
              This information will be sent to the operations team.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
              className="flex-1 bg-orange-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {isSubmitting ? 'Moving...' : 'Move'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

