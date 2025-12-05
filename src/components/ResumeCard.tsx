import React from 'react';
import { Eye, Trash2, Download, Bot, Target } from 'lucide-react';
import { Resume } from '../types';

interface ResumeCardProps {
  resume: Resume;
  onView: () => void;
  onDelete: () => void;
}

const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  onView,
  onDelete,
}) => {
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([resume.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${resume.jobTitle}-${resume.companyName}-Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{resume.jobTitle}</h3>
          <p className="text-sm text-gray-600 truncate">{resume.companyName}</p>
        </div>
        <div className={`ml-3 flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          resume.matchScore >= 80 ? 'bg-green-100 text-green-800' :
          resume.matchScore >= 60 ? 'bg-amber-100 text-amber-800' :
          'bg-red-100 text-red-800'
        }`}>
          <Target className="w-3 h-3 mr-1" />
          {resume.matchScore}% match
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Bot className="w-3 h-3 mr-1" />
          <span>AI-Optimized • {resume.keywords.length} keywords</span>
        </div>
        
        {resume.suggestions.length > 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 rounded p-2">
            <strong>Suggestion:</strong> {resume.suggestions[0]}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Created {new Date(resume.createdAt).toLocaleDateString()}
        </span>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={onView}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="View Resume"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Download Resume"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Resume"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeCard;