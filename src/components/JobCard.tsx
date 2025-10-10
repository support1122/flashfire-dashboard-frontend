import React from 'react';
import { Calendar } from 'lucide-react';
import { Job } from '../types';
import { getTimeAgo } from '../utils/getTimeAgo';
interface JobCardProps {
  job: Job;
  onDragStart: (e: React.DragEvent, job: Job) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
  showJobModal: boolean;
  setSelectedJob: React.Dispatch<React.SetStateAction<Job | null>>;
  setShowJobModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const JobCard: React.FC<JobCardProps> = ({
  setSelectedJob,
  setShowJobModal,
  job,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}) => {
  const handleClick = () => {
    setShowJobModal(true);
    setSelectedJob(job);
  };

  return (
    <div
      onClick={handleClick}
      draggable
      onDragStart={(e) => onDragStart(e, job)}
      onDragEnd={onDragEnd}
      className="bg-white rounded-lg border w-full border-gray-200 p-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-move hover:scale-[1.02] hover:-rotate-1"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 ">{job.jobTitle}</h4>
          <div className="flex items-center text-sm text-gray-600 mt-1">
<img 
  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(job.companyName)}.com&sz=64`} 
  alt="Company Logo" 
  className="w-[20px] h-[20px] m-2"
  onError={(e) => {
    e.currentTarget.style.display = 'none';
  }}
/>
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
