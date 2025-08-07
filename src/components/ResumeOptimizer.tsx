import React, { useEffect, useState } from 'react';
import { Zap, Sparkles, FileText, Upload, FolderArchive } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ResumeOptimizer: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'base' | 'optimized' | 'coverLetter'>('base');
  const [baseResume, setBaseResume] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [optimized, setOptimized] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('userAuth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        const resumeLink = parsed.userDetails?.resumeLink;
        const coverLetter = parsed.userDetails?.coverLetter;
        const optimizedResume = parsed.userDetails?.optimizedResume;
        if (coverLetter) setCoverLetter(coverLetter); // Load optimized resume from localStorage
        if (resumeLink) setBaseResume(resumeLink); // Load base resume from localStorage
        if (optimizedResume) setOptimized(optimizedResume); // Load optimized resume from localStorage
      } catch (error) {
        console.error('Error parsing userAuth from localStorage:', error);
      }
    }
  }, []);

const handleFileUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  type: 'base' | 'coverLetter' | 'optimized'
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsUploading(true);
  try {
    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_CLOUD_PRESET_PDF);
    formData.append("resource_type", "auto");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    const uploadedURL = data.secure_url;

    const storedAuth = localStorage.getItem("userAuth");
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);

      let updatedField = {};
      if (type === "base") {
        setBaseResume(uploadedURL);
        updatedField = { resumeLink: uploadedURL };
      } else if (type === "coverLetter") {
        setCoverLetter(uploadedURL);
        updatedField = { coverLetter: uploadedURL };
      } else if (type === "optimized") {
        setOptimized(uploadedURL);
        updatedField = { optimizedResume: uploadedURL };
      }

      // Send updated field to backend and get updated user info
      const backendRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plans/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedField,
          token: parsed.token,
          userDetails: parsed.userDetails,
          planType: parsed.userDetails.planType,
          planLimit: parsed.userDetails.planLimit,
        }),
      });

      const backendData = await backendRes.json();

      // ✅ Update localStorage with backend response
      const updatedUser = {
        ...parsed,
        userDetails: {
          ...backendData.updatedUserDetails || parsed.userDetails, // fallback if not returned
        },
      };
      localStorage.setItem("userAuth", JSON.stringify(updatedUser));
    }
  } catch (err) {
    alert("Upload failed.");
    console.error(err);
  } finally {
    setIsUploading(false);
  }
};




  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  <div className="flex flex-row gap-2 justify-around items-start h-full w-full">
    {/* Left Tabs Section */}
    <div className="w-48 flex-shrink-0 border-r-2 ml-1 left-0 fixed ">
      <h1 className='w-full flex justify-center items-center gap-2 p-2 border-b-2 m-2'><FolderArchive className='text-purple-500' /> Applications Materials :- </h1>
      <div className="flex flex-col space-y-4 sticky top-4">
        <button
          onClick={() => setActiveTab('base')}
          className={`text-left p-3 rounded-lg border transition-all duration-200 ${
            activeTab === 'base'
              ? 'bg-purple-200 font-semibold text-purple-800'
              : 'hover:bg-purple-100'
          }`}
        >
          Base Resume
        </button>
        <button
          onClick={() => setActiveTab('coverLetter')}
          className={`text-left p-3 rounded-lg border transition-all duration-200 ${
            activeTab === 'coverLetter'
              ? 'bg-purple-200 font-semibold text-purple-800'
              : 'hover:bg-purple-100'
          }`}
        >
          Cover Letter
        </button>
        <button
          onClick={() => setActiveTab('optimized')}
          className={`text-left p-3 rounded-lg border transition-all duration-200 ${
            activeTab === 'optimized'
              ? 'bg-purple-200 font-semibold text-purple-800'
              : 'hover:bg-purple-100'
          }`}
        >
          Optimized Resume
        </button>
      </div>
    </div>

    {/* Right Content Section */}
    <div className="flex-grow relative left-16">
      {/* Base Resume View */}
      {activeTab === 'base' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-500" />
              Base Resume
            </h4>
            <label className="flex items-center space-x-2 cursor-pointer text-sm text-purple-600">
              <Upload className="w-4 h-4" />
              <span className="border-2 p-2 rounded-2xl font-bold hover:text-white hover:bg-violet-600 duration-300">
                {isUploading ? 'Uploading...' : 'Upload Base Resume'}
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
              className="w-full h-[80vh] border rounded"
            />
          ) : (
            <p className="text-sm text-gray-500">No base resume uploaded yet.</p>
          )}
        </div>
      )}

      {/* Cover Letter View */}
      {activeTab === 'coverLetter' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-500" />
              Cover Letter
            </h4>
            <label className="flex items-center space-x-2 cursor-pointer text-sm text-purple-600">
              <Upload className="w-4 h-4" />
              <span className="border-2 p-2 rounded-2xl font-bold hover:text-white hover:bg-violet-600 duration-300">
                {isUploading ? 'Uploading...' : 'Upload Cover Letter'}
              </span>
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e, 'coverLetter')}
              />
            </label>
          </div>
          {coverLetter ? (
            <iframe
              src={coverLetter}
              title="Cover Letter"
              className="w-full h-[80vh] border rounded"
            />
          ) : (
            <p className="text-sm text-gray-500">No cover letter uploaded yet.</p>
          )}
        </div>)}
        {activeTab === 'optimized' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-500" />
              Optimized Resume
            </h4>
            <label className="flex items-center space-x-2 cursor-pointer text-sm text-purple-600">
              <Upload className="w-4 h-4" />
              <span className="border-2 p-2 rounded-2xl font-bold hover:text-white hover:bg-violet-600 duration-300">
                {isUploading ? 'Uploading...' : 'Upload Optimized Resume'}
              </span>
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e, 'optimized')}
              />
            </label>
          </div>
          {optimized ? (
            <iframe
              src={optimized}
              title="Optimized Resume"
              className="w-full h-[80vh] border rounded"
            />
          ) : (
            <p className="text-sm text-gray-500">No optimized resumes uploaded yet.</p>
          )}
        </div>
      )}
    </div>
  </div>
</div>


  );
};

export default ResumeOptimizer;
