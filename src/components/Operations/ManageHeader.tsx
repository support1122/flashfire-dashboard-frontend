import { Shield, LogOut, LogIn } from "lucide-react";
import { useOperationsStore } from "../../state_management/Operations";

interface ManageHeaderProps {
     onLogout: () => void;
     onSwitchToResumeBuilder?: () => void;
     loadAllData?: () => void;
}

export default function ManageHeader({
     onLogout,
}: ManageHeaderProps) {
     const name = useOperationsStore((state) => state.name);

     

     return (
          <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg">
               <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                         {/* Left side */}
                         <div className="flex items-center space-x-4">
                              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl">
                                   <Shield className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                   <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                        Hi, {name || "User"}
                                   </h1>
                                   <p className="text-gray-600 mt-1">
                                        Welcome to your control panel
                                   </p>
                              </div>
                         </div>

                         <div className="flex items-center space-x-4">
                         <button
                                   onClick={() => {
                                        // setJobDescription(jobDetails.jobDescription);
                                        window.open(
                                            `/optimize/1`,
                                            "_blank"
                                        );
                                    }}
                                   className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                              >
                                   <LogIn className="h-4 w-4" />
                                   <span>AI Optimizer</span>
                              </button>
                              <button
                                   onClick={onLogout}
                                   className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                              >
                                   <LogOut className="h-4 w-4" />
                                   <span>Logout</span>
                              </button>
                         </div>
                    </div>
               </div>
          </header>
     );
}
