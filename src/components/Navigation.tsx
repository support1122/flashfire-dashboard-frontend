import React, { useEffect, useRef, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Briefcase,
  FileText,
  User,
  LogOut,
  ChevronDown,
  Edit2Icon,
  Gift,
} from 'lucide-react';
import { UserContext } from '../state_management/UserContext.tsx';
import { useUserProfile } from '../state_management/ProfileContext';
import { useOperationsStore } from '../state_management/Operations.ts';
import { toastUtils, toastMessages } from '../utils/toast';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  setUserProfileFormVisibility: any;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  setUserProfileFormVisibility,
}) => {
  const navigate = useNavigate();
  let ctx = useContext(UserContext);
  let token = ctx?.token;
  let userDetails = ctx?.userDetails;
  const [user, setUser] = useState(userDetails?.name || '');
  const [profileDropDown, setProfileDropDown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { userProfile } = useUserProfile();
  const { role } = useOperationsStore();
  const hasProfile = !!userProfile?.email;

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'jobs', label: 'Job Tracker', icon: Briefcase },
    { id: 'optimizer', label: 'Documents', icon: FileText },
  ];

  useEffect(() => {
    setUser(userDetails?.name || '');
  }, [userDetails]);

  const handleSwitchUser = () => {
    localStorage.removeItem('userAuth');
    toastUtils.success('Switching to operations view...');
    navigate('/manage');
  };

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
    toastUtils.success(toastMessages.logoutSuccess);
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-20">
          {/* Logo Left */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <img src="./Logo.png" alt="" className="rounded-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                FLASHFIRE
              </h1>
              <p className="text-xs text-gray-500 font-medium -mt-1">
                Complete Workflow Optimization
              </p>
            </div>
          </div>

          {/* Center Tabs */}
          <div className="flex items-center space-x-4">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                to="/"
                onClick={() => onTabChange(id)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            ))}

            {/* Refer & Earn button with NEW badge */}
            <Link
              to="/refer"
              className="relative flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Gift className="w-5 h-5" />
              <span className="hidden sm:block">Refer & Earn</span>
              <span className="absolute -top-2 -right-2 text-[10px] font-bold bg-red-600 text-white px-2 py-[1px] rounded-full">
                NEW
              </span>
            </Link>
          </div>

          {/* Right Profile */}
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
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    profileDropDown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown */}
              {profileDropDown && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-6 px-6 z-50">
                  <div className="absolute -top-2 right-8 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                  <Link to="/profile" target="_blank" rel="noopener noreferrer">
                    <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <User className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-bold text-gray-900">{user}</p>
                        <p className="text-sm text-gray-500 underline">View Profile</p>
                      </div>
                    </div>
                  </Link>
                  {role == 'operations' ? null : (
                    <div className="py-6 space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Email Address
                        </p>
                        <p className="text-sm text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-lg">
                          {userDetails?.email}
                        </p>
                      </div>
                      {!hasProfile && (
                        <div
                          className="w-fit"
                          onClick={() => setUserProfileFormVisibility(true)}
                        >
                          <div className="hover:cursor-pointer inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-50 to-yellow-200 text-amber-700 border-2 border-amber-200">
                            <Edit2Icon className="h-3 w-3 m-2" /> Edit/ Setup Profile
                          </div>
                        </div>
                      )}
                      {role == 'operations' ? null : (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Current Plan
                          </p>
                          <div className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-2 border-amber-200">
                            <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                            {userDetails?.planType || 'Free'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {role == 'operations' ? (
                    <div className="pt-6 border-t border-gray-100 space-y-2">
                      <button
                        onClick={handleSwitchUser}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Switch Client</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-6 border-t border-gray-100 space-y-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
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
    </nav>
  );
};

export default Navigation;
