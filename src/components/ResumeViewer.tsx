import React, { useState } from 'react';
import { X, Download, Edit3, Bot, Target, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import { Resume } from '../types';
import { generateResumeInsights } from '../utils/mockAI';

interface ResumeViewerProps {
  resume: Resume;
  onClose: () => void;
  onUpdate: (updates: Partial<Resume>) => void;
}

const ResumeViewer: React.FC<ResumeViewerProps> = ({
  resume,
  onClose,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(resume.content);
  const [activeTab, setActiveTab] = useState<'content' | 'insights'>('content');

  const insights = generateResumeInsights(resume);

  const handleSave = () => {
    onUpdate({ content: editContent });
    setIsEditing(false);
  };

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
    <div className="p-6 max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            {resume.jobTitle} at {resume.companyName}
          </h3>
          <div className="flex items-center space-x-4 mt-2">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              resume.matchScore >= 80 ? 'bg-green-100 text-green-800' :
              resume.matchScore >= 60 ? 'bg-amber-100 text-amber-800' :
              'bg-red-100 text-red-800'
            }`}>
              <Target className="w-4 h-4 mr-1" />
              {resume.matchScore}% match
            </div>
            <span className="text-sm text-gray-500">
              <Bot className="w-4 h-4 inline mr-1" />
              AI-Optimized
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Download Resume"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Edit Resume"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'content'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Resume Content
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'insights'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          AI Insights
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'content' ? (
          <div className="h-full flex flex-col">
            {isEditing ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 w-full p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="flex items-center justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(resume.content);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 leading-relaxed">
                    {resume.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full overflow-y-auto space-y-6">
            {/* Match Score Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-600" />
                Match Score Analysis
              </h4>
              <div className="flex items-center mb-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      resume.matchScore >= 80 ? 'bg-green-500' :
                      resume.matchScore >= 60 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${resume.matchScore}%` }}
                  />
                </div>
                <span className="ml-3 text-2xl font-bold text-gray-900">
                  {resume.matchScore}%
                </span>
              </div>
              <p className="text-gray-600">
                Your resume matches {resume.matchScore}% of the job requirements based on keywords and content analysis.
              </p>
            </div>

            {/* Keywords */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Matched Keywords ({resume.keywords.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {resume.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Strong Points */}
            {insights.strongPoints.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Strong Points
                </h4>
                <ul className="space-y-2">
                  {insights.strongPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-green-800">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvement Suggestions */}
            {resume.suggestions.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  AI Suggestions for Improvement
                </h4>
                <ul className="space-y-3">
                  {resume.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-amber-800">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Optimization Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Optimization Details
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Created:</span>
                  <span className="text-blue-900 font-medium">
                    {new Date(resume.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Last Updated:</span>
                  <span className="text-blue-900 font-medium">
                    {new Date(resume.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Optimization Score:</span>
                  <span className="text-blue-900 font-medium">
                    {resume.matchScore >= 80 ? 'Excellent' :
                     resume.matchScore >= 60 ? 'Good' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeViewer;