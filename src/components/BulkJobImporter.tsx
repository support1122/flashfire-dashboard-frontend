import React, { useState, useRef } from 'react';
import { Upload, Link, Settings, Play, Pause, Square, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { BulkJobImport, ApplicationProgress, BaseResume } from '../types';
import { validateJobUrl } from '../utils/jobScraper';

interface BulkJobImporterProps {
  baseResumes: BaseResume[];
  onStartBulkImport: (importData: BulkJobImport & { selectedResumeId: string }) => void;
  progress?: ApplicationProgress;
  onPauseResume: () => void;
  onStop: () => void;
}

const BulkJobImporter: React.FC<BulkJobImporterProps> = ({
  baseResumes,
  onStartBulkImport,
  progress,
  onPauseResume,
  onStop,
}) => {
  const [jobUrls, setJobUrls] = useState<string>('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [optimizeResumes, setOptimizeResumes] = useState(true);
  const [autoApply, setAutoApply] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlsChange = (value: string) => {
    setJobUrls(value);
    setValidationErrors([]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setJobUrls(content);
      };
      reader.readAsText(file);
    }
  };

  const validateUrls = (urls: string[]): string[] => {
    const errors: string[] = [];
    const invalidUrls: string[] = [];
    
    urls.forEach((url, index) => {
      if (!url.trim()) return;
      
      if (!validateJobUrl(url.trim())) {
        invalidUrls.push(`Line ${index + 1}: ${url.trim()}`);
      }
    });
    
    if (invalidUrls.length > 0) {
      errors.push(`Invalid or unsupported job URLs:\n${invalidUrls.join('\n')}`);
    }
    
    return errors;
  };

  const handleStartImport = () => {
    const urls = jobUrls.split('\n').map(url => url.trim()).filter(url => url.length > 0);
    
    if (urls.length === 0) {
      setValidationErrors(['Please enter at least one job URL']);
      return;
    }
    
    if (!selectedResumeId) {
      setValidationErrors(['Please select a base resume']);
      return;
    }
    
    const errors = validateUrls(urls);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    onStartBulkImport({
      jobUrls: urls,
      optimizeResumes,
      autoApply,
      selectedResumeId,
    });
  };

  const getProgressPercentage = () => {
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  const isProcessing = progress?.status === 'processing';
  const isPaused = progress?.status === 'paused';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Zap className="w-6 h-6 mr-2 text-purple-600" />
            Bulk Job Import & Auto-Apply
          </h3>
          <p className="text-gray-600 mt-1">Import multiple job URLs and automatically optimize resumes</p>
        </div>
      </div>

      {!isProcessing ? (
        <div className="space-y-6">
          {/* Resume Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Base Resume *
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Choose a resume...</option>
              {baseResumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.name}
                </option>
              ))}
            </select>
          </div>

          {/* Job URLs Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Job URLs (one per line) *
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload .txt file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            <textarea
              value={jobUrls}
              onChange={(e) => handleUrlsChange(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              placeholder={`https://www.linkedin.com/jobs/view/123456789
https://www.indeed.com/viewjob?jk=abcd1234
https://jobs.lever.co/company/job-id
...`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported sites: LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, Dice, Stack Overflow Jobs
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <input
                type="checkbox"
                id="optimizeResumes"
                checked={optimizeResumes}
                onChange={(e) => setOptimizeResumes(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div>
                <label htmlFor="optimizeResumes" className="text-sm font-medium text-gray-900 cursor-pointer">
                  ✅ Tailor my resume for each job
                </label>
                <p className="text-xs text-gray-600">AI will optimize your resume for each job description</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg">
              <input
                type="checkbox"
                id="autoApply"
                checked={autoApply}
                onChange={(e) => setAutoApply(e.target.checked)}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
              />
              <div>
                <label htmlFor="autoApply" className="text-sm font-medium text-gray-900 cursor-pointer">
                  🚀 Auto-apply to jobs
                </label>
                <p className="text-xs text-gray-600">Automatically submit applications where possible</p>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="text-red-900 font-medium">Please fix the following errors:</h4>
                  <ul className="text-red-700 text-sm mt-1 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="whitespace-pre-line">{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartImport}
            disabled={!selectedResumeId || jobUrls.trim().length === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Start Bulk Import & Optimization</span>
          </button>
        </div>
      ) : (
        /* Progress Display */
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {isPaused ? 'Processing Paused' : 'Processing Jobs...'}
            </h4>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <p className="text-2xl font-bold text-gray-900">{getProgressPercentage()}%</p>
            <p className="text-gray-600">
              {progress?.processed} of {progress?.total} jobs processed
            </p>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-sm text-blue-600">Processed</p>
              <p className="text-xl font-bold text-blue-900">{progress?.processed || 0}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-sm text-green-600">Applied</p>
              <p className="text-xl font-bold text-green-900">{progress?.applied || 0}</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600 mx-auto mb-1" />
              <p className="text-sm text-amber-600">Pending</p>
              <p className="text-xl font-bold text-amber-900">{progress?.pending || 0}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-sm text-red-600">Errors</p>
              <p className="text-xl font-bold text-red-900">{progress?.errors || 0}</p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={onPauseResume}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            <button
              onClick={onStop}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkJobImporter;
