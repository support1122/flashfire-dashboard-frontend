import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { parsePDFResume, ParsedResumeData } from '../utils/pdfParser';

interface PDFUploaderProps {
  onResumeUploaded: (resumeData: ParsedResumeData) => void;
  onCancel: () => void;
}

const PDFUploader: React.FC<PDFUploaderProps> = ({ onResumeUploaded, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    } else {
      setError('Please upload a PDF file');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setUploadedFile(file);

    try {
      const resumeData = await parsePDFResume(file);
      
      // Validate that we extracted meaningful data
      if (!resumeData.text || resumeData.text.length < 100) {
        throw new Error('Could not extract enough text from the PDF. Please ensure it\'s a text-based PDF.');
      }

      onResumeUploaded(resumeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Upload Your Resume</h3>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-purple-400 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isDragging ? 'bg-purple-100' : 'bg-gray-100'
            }`}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-purple-600' : 'text-gray-600'}`} />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your resume PDF here
              </p>
              <p className="text-sm text-gray-600 mb-4">
                or click to browse files
              </p>
              
              <label className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Choose PDF File
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-blue-900 font-medium">Processing your resume...</p>
                <p className="text-blue-700 text-sm">
                  Extracting text and analyzing content from {uploadedFile?.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-900 font-medium">Upload Failed</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Tips for best results:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Upload a text-based PDF (not a scanned image)</li>
            <li>• Ensure your resume includes contact info, skills, and experience</li>
            <li>• File size should be under 10MB</li>
            <li>• The system will automatically extract and organize your information</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PDFUploader;