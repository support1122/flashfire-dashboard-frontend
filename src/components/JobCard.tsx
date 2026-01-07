import React, {useState, useEffect, useRef} from 'react';
import { Calendar } from 'lucide-react';
import { Job } from '../types';
import { getTimeAgo } from '../utils/getTimeAgo';
import { useDownloadHighlightStore } from '../state_management/DownloadHighlightStore.ts';
import { useOperationsStore } from '../state_management/Operations.ts';
interface JobCardProps {
  job: Job;
  onDragStart: (e: React.DragEvent, job: Job) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  showJobModal: boolean;
  setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>;
  setShowJobModal: React.Dispatch<React.SetStateAction<boolean>>;
  onShowRemovalReason?: (job: Job) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  setSelectedJob,
  setShowJobModal,
  job,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
  onShowRemovalReason,
}) => {
  const { isHighlighting } = useDownloadHighlightStore();
  const { role } = useOperationsStore();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isRemoved = job.currentStatus?.toLowerCase().startsWith('deleted') || 
                    job.currentStatus?.toLowerCase().startsWith('removed');
  
  const handleClick = () => {
    setShowJobModal(true);
    setSelectedJob(job);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isRemoved || !onShowRemovalReason) return;
    
    longPressTimer.current = setTimeout(() => {
      if (onShowRemovalReason) {
        onShowRemovalReason(job);
      }
    }, 5000);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isRemoved || !onShowRemovalReason) return;
    
    longPressTimer.current = setTimeout(() => {
      if (onShowRemovalReason) {
        onShowRemovalReason(job);
      }
    }, 5000);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);
  const getCompanyDomain = (companyName: string) => {
    return companyName.replace(/\s+/g, '').toLowerCase();
  };
  const shouldHighlight = isHighlighting && 
    (role === "operator" || role === "operations") && 
    !job.downloaded;
  const sanitizeCompanyDomain = (name) => {
  if (!name) return "example.com";

  // Clean spaces and invalid characters
  let domain = name
    .toLowerCase()
    .replace(/\s+/g, "")       // remove spaces
    .replace(/[^a-z0-9.-]/g, ""); // remove invalid chars

  // Avoid double .com
  if (!domain.includes(".")) domain += ".com";

  return domain;
};

  return (
    <div
      onClick={handleClick}
      draggable
      onDragStart={(e) => onDragStart(e, job)}
      onDragEnd={onDragEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`rounded-lg border w-full border-gray-200 p-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-move hover:scale-[1.02] hover:-rotate-1 ${
        shouldHighlight 
          ? "bg-red-100 border-red-300" 
          : "bg-white"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 ">{job.jobTitle}</h4>
          <div className="flex items-center text-sm text-gray-600 mt-1">
  {job.companyName && (
              <img
              src={`https://www.google.com/s2/favicons?domain=${sanitizeCompanyDomain(job.companyName)}&sz=64`}
              alt="Company Logo"
              className="w-[20px] h-[20px] m-2"
              style={{ display: 'none' }} // Start hidden until load check
              onError={(e) => {
                e.currentTarget.style.display = "none"; // Hide broken image
              }}
              onLoad={(e) => {
                const img = e.currentTarget;
                // Default globe is always 16x16; custom ones resize to 64x64
                if (img.naturalHeight === 16 && img.naturalWidth === 16) {
                  img.style.display = "none"; // Hide default
                } else {
                  img.style.display = "block"; // Show custom
                }
              }}
            />
            )}
            <span className="">{job.companyName}</span> <hr />
          </div>
        </div>
      </div>

      <div className="flex items-center text-xs text-gray-500 mb-3">
        <Calendar className="w-3 h-3 mr-1" />
        <span>
         {getTimeAgo(job?.createdAt || job?.dateAdded || job?.updatedAt)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
            title="Edit Job"
          >
            <Edit3 className="w-4 h-4" />
          </button> */}
          {/* <button
            // disabled
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1  bg-gray-100 rounded hover:text-neutral-500 text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
