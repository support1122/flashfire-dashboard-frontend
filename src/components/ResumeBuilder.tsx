import React, { useState } from 'react';
import { FileText, Plus, Download, Upload, Search, Bot, Target, File } from 'lucide-react';
import { Resume, BaseResume, Job } from '../types';
import BaseResumeForm from './BaseResumeForm';
import ResumeCard from './ResumeCard';
import ResumeViewer from './ResumeViewer';
import PDFUploader from './PDFUploader';
import { ParsedResumeData } from '../utils/pdfParser';

interface ResumeBuilderProps {
  resumes: Resume[];
  baseResumes: BaseResume[];
  jobs: Job[];
  onAddResume: (resume: Resume) => void;
  onUpdateResume: (id: string, updates: Partial<Resume>) => void;
  onDeleteResume: (id: string) => void;
  onAddBaseResume: (baseResume: Omit<BaseResume, 'id' | 'createdAt' | 'updatedAt'>) => BaseResume;
  onUpdateBaseResume: (id: string, updates: Partial<BaseResume>) => void;
  onDeleteBaseResume: (id: string) => void;
  onUploadPDFResume: (resumeData: ParsedResumeData) => void;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({
  resumes,
  baseResumes,
  jobs,
  onAddResume,
  onUpdateResume,
  onDeleteResume,
  onAddBaseResume,
  onUpdateBaseResume,
  onDeleteBaseResume,
  onUploadPDFResume,
}) => {
  const [activeTab, setActiveTab] = useState<'optimized' | 'base'>('optimized');
  const [showBaseResumeForm, setShowBaseResumeForm] = useState(false);
  const [showPDFUploader, setShowPDFUploader] = useState(false);
  const [editingBaseResume, setEditingBaseResume] = useState<BaseResume | null>(null);
  const [viewingResume, setViewingResume] = useState<Resume | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResumes = resumes.filter(resume =>
    resume.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resume.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBaseResumes = baseResumes.filter(baseResume =>
    baseResume.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBaseResume = (baseResumeData: Omit<BaseResume, 'id' | 'createdAt' | 'updatedAt'>) => {
    onAddBaseResume(baseResumeData);
    setShowBaseResumeForm(false);
  };

  const handleEditBaseResume = (baseResumeData: Omit<BaseResume, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingBaseResume) {
      onUpdateBaseResume(editingBaseResume.id, baseResumeData);
      setEditingBaseResume(null);
    }
  };

  const handlePDFUpload = (resumeData: ParsedResumeData) => {
    onUploadPDFResume(resumeData);
    setShowPDFUploader(false);
  };

  const averageMatchScore = resumes.length > 0 
    ? Math.round(resumes.reduce((sum, resume) => sum + resume.matchScore, 0) / resumes.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Resume Builder</h2>
          <p className="text-gray-600">Upload your PDF resume and get AI-optimized versions for each job</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search resumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowPDFUploader(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload PDF</span>
          </button>
          
          {activeTab === 'base' && (
            <button
              onClick={() => setShowBaseResumeForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Optimized Resumes</p>
              <p className="text-2xl font-bold text-gray-900">{resumes.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Base Templates</p>
              <p className="text-2xl font-bold text-gray-900">{baseResumes.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Match Score</p>
              <p className="text-2xl font-bold text-gray-900">{averageMatchScore}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jobs Applied</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.filter(j => j.status !== 'saved').length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <File className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('optimized')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'optimized'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          AI-Optimized Resumes ({resumes.length})
        </button>
        <button
          onClick={() => setActiveTab('base')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'base'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Base Templates ({baseResumes.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'optimized' ? (
        <div>
          {filteredResumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onView={() => setViewingResume(resume)}
                  onDelete={() => onDeleteResume(resume.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No optimized resumes yet</h3>
              <p className="text-gray-600 mb-6">
                Upload your PDF resume and add jobs to automatically generate AI-optimized resumes
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowPDFUploader(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload PDF Resume</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {filteredBaseResumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBaseResumes.map((baseResume) => (
                <div
                  key={baseResume.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{baseResume.name}</h3>
                      <p className="text-sm text-gray-600">
                        {baseResume.skills.slice(0, 3).join(', ')}
                        {baseResume.skills.length > 3 && ` +${baseResume.skills.length - 3} more`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setEditingBaseResume(baseResume)}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteBaseResume(baseResume.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Created {new Date(baseResume.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No base resumes yet</h3>
              <p className="text-gray-600 mb-6">
                Upload a PDF resume or create a base template to get started
              </p>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowPDFUploader(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload PDF Resume</span>
                </button>
                <button
                  onClick={() => setShowBaseResumeForm(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Template</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PDF Uploader Modal */}
      {showPDFUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <PDFUploader
              onResumeUploaded={handlePDFUpload}
              onCancel={() => setShowPDFUploader(false)}
            />
          </div>
        </div>
      )}

      {/* Base Resume Form Modal */}
      {(showBaseResumeForm || editingBaseResume) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <BaseResumeForm
              baseResume={editingBaseResume}
              onSubmit={editingBaseResume ? handleEditBaseResume : handleAddBaseResume}
              onCancel={() => {
                setShowBaseResumeForm(false);
                setEditingBaseResume(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Resume Viewer Modal */}
      {viewingResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <ResumeViewer
              resume={viewingResume}
              onClose={() => setViewingResume(null)}
              onUpdate={(updates) => onUpdateResume(viewingResume.id, updates)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;