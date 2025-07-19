import React, { useEffect, useRef, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Briefcase, FileText, User, LogOut, ChevronDown } from 'lucide-react';
import { UserContext } from '../state_management/UserContext.tsx';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const { userDetails, token } = useContext(UserContext);
  const [user, setUser] = useState(userDetails?.name || '');
  const [profileDropDown, setProfileDropDown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'jobs', label: 'Job Tracker', icon: Briefcase },
    { id: 'optimizer', label: 'Resume Optimizer', icon: FileText },
  ];

  useEffect(() => {
    setUser(userDetails?.name || '');
  }, [userDetails]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropDown(false);
      }
    };

    if (profileDropDown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropDown]);

  const handleLogout = () => {
    localStorage.clear();
    setUser('');
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-20">
          
          {/* Enhanced Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  FLASHFIRE
                </h1>
                <p className="text-xs text-gray-500 font-medium -mt-1">Complete Workflow Optimization</p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Navigation Tabs */}
          <div className="flex items-center space-x-8">
            <div className="flex space-x-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                    activeTab === id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:block">{label}</span>
                </button>
              ))}
            </div>
            
            {/* Enhanced User Profile Section */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropDown(!profileDropDown)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group border border-gray-200 hover:border-gray-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-700">{user}</p>
                    <p className="text-xs text-gray-500">Account</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileDropDown ? 'rotate-180' : ''}`} />
                </button>

                {/* Enhanced Dropdown Menu */}
                {profileDropDown && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-6 px-6 z-50">
                    {/* Arrow */}
                    <div className="absolute -top-2 right-8 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                    
                    {/* User Header */}
                    <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-bold text-gray-900">{user}</p>
                        <p className="text-sm text-gray-500">Account Details</p>
                      </div>
                    </div>
                    
                    {/* User Details */}
                    <div className="py-6 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Email Address
                        </p>
                        <p className="text-sm text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-lg">
                          {userDetails?.email}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Current Plan
                        </p>
                        <div className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-2 border-amber-200">
                          <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                          {userDetails?.planType || 'Free'}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 border-t border-gray-100 space-y-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <User className="w-5 h-5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;