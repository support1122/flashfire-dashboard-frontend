import React from 'react';
import { Edit3, Trash2, Calendar, Building } from 'lucide-react';
import { Job } from '../types';
import { formatDistanceToNow } from 'date-fns';
interface JobCardProps {
  job: Job;
  onDragStart: (e: React.DragEvent, job: Job) => void;
  onEdit: () => void;
  onDelete: () => void;
  showJobModal: boolean;
  setSelectedJob: React.Dispatch<React.SetStateAction<{}>>;
  setShowJobModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const JobCard: React.FC<JobCardProps> = ({
  setSelectedJob,
  setShowJobModal,
  job,
  onDragStart,
  onEdit,
  onDelete,
}) => {
  console.log('triggered..');
  return (
    <div
      onClick={() => {
        setShowJobModal(true);
        setSelectedJob(job);
      }}
      draggable
      onDragStart={(e) => onDragStart(e, job)}
      className="bg-white rounded-lg border w-full border-gray-200 p-2 shadow-sm hover:shadow-md transition-all duration-200 cursor-move"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 ">{job.jobTitle}</h4>
          <div className="flex items-center text-sm text-gray-600 mt-1">
<img src={`https://www.google.com/s2/favicons?domain=${job.companyName}.com&sz=64`} alt="Company Logo" className="w-[20px] h-[20px] m-2" />
            <span className="">{job.companyName}</span> <hr />
          </div>
        </div>
      </div>

      <div className="flex items-center text-xs text-gray-500 mb-3">
        <Calendar className="w-3 h-3 mr-1" />
        <span>{job.createdAt && !isNaN(new Date(job.createdAt).getTime())
            ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
            : "N/A"}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
            title="Edit Job"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            disabled
            className="p-1 text-gray-300 bg-gray-100 rounded cursor-not-allowed transition-colors"
            title="Delete Disabled"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
