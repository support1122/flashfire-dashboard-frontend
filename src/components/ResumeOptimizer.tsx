import React, { useEffect, useState } from 'react';
import { Zap, Sparkles, FileText, Upload } from 'lucide-react';

const ResumeOptimizer: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'base' | 'optimized'>('base');
  const [baseResume, setBaseResume] = useState<string | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('userAuth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        const resumeLink = parsed.userDetails?.resumeLink;
        const optimizedResumeLink = parsed.userDetails?.optimizedResumeLink;
        if (optimizedResumeLink) setOptimizedResume(optimizedResumeLink); // Load optimized resume from localStorage
        if (resumeLink) setBaseResume(resumeLink); // Load base resume from localStorage
      } catch (error) {
        console.error('Error parsing userAuth from localStorage:', error);
      }
    }
  }, []);

 const handleFileUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  type: 'base' | 'optimized'
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsUploading(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_CLOUD_PRESET_PDF);
    formData.append("resource_type", "raw");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    const uploadedURL = data.secure_url;

    const storedAuth = localStorage.getItem("userAuth");
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);

      if (type === "base") {
        setBaseResume(uploadedURL);

        const updatedUser = {
          ...parsed,
          userDetails: {
            ...parsed.userDetails,
            resumeLink: uploadedURL,
          },
        };
        localStorage.setItem("userAuth", JSON.stringify(updatedUser));

        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeLink: uploadedURL,
            token: parsed.token,
            userDetails: parsed.userDetails,
            planType: parsed.userDetails.planType,
            planLimit: parsed.userDetails.planLimit,
          }),
        });
      } else if (type === "optimized") {
        setOptimizedResume(uploadedURL);

        const updatedUser = {
          ...parsed,
          userDetails: {
            ...parsed.userDetails,
            optimizedResumeLink: uploadedURL,
          },
        };
        localStorage.setItem("userAuth", JSON.stringify(updatedUser));

        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            optimizedResumeLink: uploadedURL,
            token: parsed.token,
            userDetails: parsed.userDetails,
            planType: parsed.userDetails.planType,
            planLimit: parsed.userDetails.planLimit,
          }),
        });
      }
    }
  } catch (err) {
    alert("Upload failed.");
    console.error(err);
  } finally {
    setIsUploading(false);
  }
};


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Zap className="w-8 h-8 mr-3 text-purple-600" />
            Smart Resume Optimizer
          </h2>
          <p className="text-gray-600 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
            Add 6–10 strategic keywords from any job description • Maintain exact format • 95%+ ATS Score
          </p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-4 gap-8">
        {/* Left-side Tabs */}
        <div className="col-span-1">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setActiveTab('base')}
              className={`text-left p-3 rounded-lg border hover:bg-purple-100 ${
                activeTab === 'base' ? 'bg-purple-200 font-bold' : ''
              }`}
            >
              Base Resume
            </button>
            <button
              onClick={() => setActiveTab('optimized')}
              className={`text-left p-3 rounded-lg border hover:bg-purple-100 ${
                activeTab === 'optimized' ? 'bg-purple-200 font-bold' : ''
              }`}
            >
              Optimized Resume
            </button>
          </div>
        </div>

        {/* Right-side Content */}
        <div className="col-span-3">
          {/* Base Resume Tab */}
          {activeTab === 'base' && (
            <div className="bg-white rounded-xl w-full shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-500" />
                  Base Resume
                </h4>
                <label className="flex items-center space-x-2 cursor-pointer text-sm text-purple-600">
                  <Upload className="w-4 h-4" />
                  <span className='border-2 p-2 rounded-2xl font-bold hover:text-white hover:bg-violet-600 duration-300'>
                    {isUploading ? "Uploading..." : "Upload Base Resume"}
                  </span>
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, 'base')}
                  />
                </label>
              </div>
              {baseResume ? (
                <iframe
                  src={baseResume}
                  title="Base Resume"
                  className="w-full h-[500px] border rounded"
                />
              ) : (
                <p className="text-sm text-gray-500">No base resume uploaded yet.</p>
              )}
            </div>
          )}

          {/* Optimized Resume Tab */}
          {activeTab === 'optimized' && (
            <div className="bg-white rounded-xl w-full shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-purple-500" />
                  Optimized Resume
                </h4>
                <label className="flex items-center space-x-2 cursor-pointer text-sm text-purple-600">
                  <Upload className="w-4 h-4" />
                  <span className='border-2 p-2 rounded-2xl font-bold hover:text-white hover:bg-violet-600 duration-300'>
                    {isUploading ? "Uploading..." : "Upload Optimized Resume"}
                  </span>
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(e, 'optimized')}
                  />
                </label>
              </div>
              {optimizedResume ? (
                <iframe
                  src={optimizedResume}
                  title="Optimized Resume"
                  className="w-full h-[500px] border rounded"
                />
              ) : (
                <p className="text-sm text-gray-500">No optimized resume uploaded yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeOptimizer;
