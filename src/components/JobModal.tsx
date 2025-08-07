import {
  X,
  Briefcase,
  Calendar,
  User,
  FileText,
  ArrowRight,
  Link,
  Copy,
  ExternalLink,
  TimerIcon,
} from "lucide-react";
import { useState, Suspense, lazy } from "react";
import LoadingScreen from "./LoadingScreen";

const AttachmentsModal = lazy(() => import("./AttachmentsModal"));

export default function JobModal({ setShowJobModal, jobDetails }) {
  const [attachmentsModalActiveStatus, setAttachmentsModalActiveStatus] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeSection, setActiveSection] = useState("details");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const sections = [
    {
      id: "details",
      label: "Job Details",
      icon: FileText,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "link",
      label: "Job Link",
      icon: Link,
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      id: "description",
      label: "Job Description",
      icon: Briefcase,
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      id: "attachments",
      label: "Resume / Attachments",
      icon: User,
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      id: "timeline",
      label: "Application Timeline",
      icon: TimerIcon,
      color: "bg-brown-800 text-orange-700 border-orange-200",
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "details":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-6">Company Name</h4>
              
              <p className="text-lg flex gap-4 font-semibold text-gray-900">  {jobDetails.companyName}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center mb-2">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Added On</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{jobDetails.createdAt}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center mb-2">
                <Briefcase className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Position</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{jobDetails.jobTitle}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center mb-2">
                <User className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Candidate</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{jobDetails.userID}</p>
            </div>
          </div>
        );

      case "link":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Job Application Link</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(jobDetails.joblink)}
                    className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </button>
                  <a
                    href={jobDetails.joblink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </a>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <code className="text-sm text-gray-700 break-all font-mono">{jobDetails.joblink}</code>
              </div>
            </div>
          </div>
        );

      case "description":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {jobDetails?.jobDescription ? (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {jobDetails.jobDescription}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm">No job description available.</p>
                )}
              </div>
            </div>
          </div>
        );

      case "attachments":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Resume / Attachments</h4>
              {jobDetails?.attachments?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobDetails.attachments.map((item, index) => (
                    <div
                      key={item}
                      className="relative group cursor-pointer bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-200"
                      onClick={() => {
                        setSelectedImage(item);
                        setAttachmentsModalActiveStatus(true);
                      }}
                    >
                      <img
                        src={item}
                        alt={`Resume ${index + 1}`}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-white rounded-full p-2 shadow-lg">
                            <ArrowRight className="w-5 h-5 text-gray-700" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                        <p className="text-white text-sm font-medium">Resume {index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-gray-500 font-medium mb-1">No resume uploaded yet</h3>
                  <p className="text-gray-400 text-sm">Resume attachments will appear here</p>
                </div>
              )}
            </div>
          </div>
        );

        case "timeline":
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">📈 Application Timeline</h4>

        {jobDetails?.timeline?.length > 0 ? (
          <ol className="relative border-s border-gray-200">
            {jobDetails.timeline.map((event, idx) => (
              <li key={idx} className="mb-10 ms-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full -start-3 ring-8 ring-white">
                  <svg
                    className="w-3 h-3 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 00-1.414 0L10 10.586 6.707 7.293A1 1 0 105.293 8.707l4 4a1 1 0 001.414 0l6-6a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <h3 className="flex items-center mb-1 text-md font-semibold text-purple-800">
                  {event}
                </h3>
                <p className="text-sm text-gray-500">Step {idx + 1}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-gray-500 italic">No timeline available.</div>
        )}
      </div>
    </div>
  );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">

        {/* 🔶 Full-width header bar (no left gap) */}
        <div className="w-full bg-gradient-to-r from-orange-600 to-red-500 text-white p-4 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="w-6 h-6 mr-3" />
              <div>
                <h1 className="text-xl font-bold">📄 FlashFire Jobs</h1>
                <p className="text-orange-100 text-sm">
                  {jobDetails.jobTitle} at {jobDetails.companyName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowJobModal(false)}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 🔹 Body: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar (Thinner) */}
          <div className="w-56 bg-gray-50 border-r border-gray-200 py-6 px-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-1">

            </h3>
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? `${section.color} border shadow-sm`
                        : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-2 ${isActive ? "" : "text-gray-500"}`} />
                    <span className="font-medium">{section.label}</span>
                    {isActive && <ArrowRight className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </div>
        </div>

        {/* Attachments Modal */}
        {attachmentsModalActiveStatus && (
          <Suspense fallback={<LoadingScreen />}>
            <AttachmentsModal
              imageLink={selectedImage}
              setAttachmentsModalActiveStatus={setAttachmentsModalActiveStatus}
            />
          </Suspense>
        )}
      </div>
    </div>
  );

}
