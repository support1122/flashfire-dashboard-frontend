import React from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { BaseResume } from '../types';

interface WorkflowOptimizerProps {
  baseResume: BaseResume | null;
  onShowPDFUploader: () => void;
}

const WorkflowOptimizer: React.FC<WorkflowOptimizerProps> = ({
  baseResume,
  onShowPDFUploader,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Zap className="w-8 h-8 mr-3 text-purple-600" />
          Perfect Format Resume Optimizer
        </h2>
        <p className="text-gray-600 flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
          Maintains EXACT formatting of your base resume • Adds 6-10 strategic keywords • 95%+ ATS Score
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Perfect Format Resume Optimizer</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            This feature will help you optimize your resume while maintaining the exact formatting of your base resume.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkflowOptimizer;