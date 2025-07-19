import { Briefcase } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="w-screen h-screen bg-gray-50 flex justify-center items-center">
      <div className="flex flex-col items-center gap-8">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
            <Briefcase className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FLASHHIRE</h1>
            <p className="text-sm text-gray-500">Complete Workflow Optimization</p>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 mb-2">Loading your dashboard</p>
          <p className="text-sm text-gray-500">Preparing your career insights...</p>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;