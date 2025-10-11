import React, { useEffect, useRef, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Briefcase, FileText, User, LogOut, ChevronDown, Edit2Icon, Building2, ChevronRight, Pencil, Save, X } from 'lucide-react';
import { UserContext } from '../state_management/UserContext.tsx';
import { useUserProfile } from "../state_management/ProfileContext";
import { useOperationsStore } from "../state_management/Operations.ts";
import { toastUtils, toastMessages } from '../utils/toast';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  setUserProfileFormVisibility : any //React.Dispatch<React.SetStateAction<boolean>>;
  
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, setUserProfileFormVisibility }) => {
  const navigate = useNavigate();
  let ctx = useContext(UserContext);
  let userDetails = ctx?.userDetails;
  const [user, setUser] = useState(userDetails?.name || '');
  const [profileDropDown, setProfileDropDown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { userProfile } = useUserProfile();
    const { role } = useOperationsStore();
  const hasProfile = !!userProfile?.email;
  
  // Dashboard Manager state - HIDDEN
  // const [dashboardManagerDropdownOpen, setDashboardManagerDropdownOpen] = useState(false);
  // const [editingName, setEditingName] = useState(false);
  // const [editingContact, setEditingContact] = useState(false);
  // const [dashboardManagerData, setDashboardManagerData] = useState({
  //   dashboardManager: userProfile?.dashboardManager || "",
  //   dashboardManagerContact: userProfile?.dashboardManagerContact || "",
  // });
  // const [tempData, setTempData] = useState({
  //   dashboardManager: "",
  //   dashboardManagerContact: "",
  // });

  // Sync dashboard manager data when userProfile changes - HIDDEN
  // useEffect(() => {
  //   if (userProfile) {
  //     setDashboardManagerData({
  //       dashboardManager: userProfile.dashboardManager || "",
  //       dashboardManagerContact: userProfile.dashboardManagerContact || "",
  //     });
  //   }
  // }, [userProfile]);
  

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'jobs', label: 'Job Tracker', icon: Briefcase },
    { id: 'optimizer', label: 'Documents', icon: FileText },
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

  const handleSwitchUser = () => {
      // localStorage.clear();
      localStorage.removeItem("userAuth");
      // setUser("");
      toastUtils.success("Switching to operations view...");
      navigate("/manage");
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser('');
    toastUtils.success(toastMessages.logoutSuccess);
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Dashboard Manager functions - HIDDEN
  // const handleEditName = () => {
  //   setTempData(prev => ({ ...prev, dashboardManager: dashboardManagerData.dashboardManager }));
  //   setEditingName(true);
  // };

  // const handleEditContact = () => {
  //   setTempData(prev => ({ ...prev, dashboardManagerContact: dashboardManagerData.dashboardManagerContact }));
  //   setEditingContact(true);
  // };

  // const handleSaveName = async () => {
  //   try {
  //     const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  //     const response = await fetch(`${API_BASE_URL}/setprofile`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${ctx?.token}`,
  //       },
  //       body: JSON.stringify({
  //         dashboardManager: tempData.dashboardManager,
  //         dashboardManagerContact: dashboardManagerData.dashboardManagerContact,
  //         token: ctx?.token,
  //         userDetails: userDetails,
  //       }),
  //     });

  //     if (response.ok) {
  //       setDashboardManagerData(prev => ({ ...prev, dashboardManager: tempData.dashboardManager }));
  //       setEditingName(false);
  //       toastUtils.success("Manager name saved successfully");
  //       // Update the userProfile context
  //       if (userProfile) {
  //         userProfile.dashboardManager = tempData.dashboardManager;
  //       }
  //     } else {
  //       console.error("Failed to save manager name");
  //       toastUtils.error("Failed to save manager name");
  //     }
  //   } catch (error) {
  //     console.error("Error saving manager name:", error);
  //     toastUtils.error("Error saving manager name");
  //   }
  // };

  // const handleSaveContact = async () => {
  //   try {
  //     const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  //     const response = await fetch(`${API_BASE_URL}/setprofile`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${ctx?.token}`,
  //       },
  //       body: JSON.stringify({
  //         dashboardManager: dashboardManagerData.dashboardManager,
  //         dashboardManagerContact: tempData.dashboardManagerContact,
  //         token: ctx?.token,
  //         userDetails: userDetails,
  //       }),
  //     });

  //     if (response.ok) {
  //       setDashboardManagerData(prev => ({ ...prev, dashboardManagerContact: tempData.dashboardManagerContact }));
  //       setEditingContact(false);
  //       toastUtils.success("Contact number saved successfully");
  //       // Update the userProfile context
  //       if (userProfile) {
  //         userProfile.dashboardManagerContact = tempData.dashboardManagerContact;
  //       }
  //     } else {
  //       console.error("Failed to save contact number");
  //       toastUtils.error("Failed to save contact number");
  //     }
  //   } catch (error) {
  //     console.error("Error saving contact number:", error);
  //     toastUtils.error("Error saving contact number");
  //   }
  // };

  // const handleCancelName = () => {
  //   setEditingName(false);
  //   setTempData(prev => ({ ...prev, dashboardManager: "" }));
  // };

  // const handleCancelContact = () => {
  //   setEditingContact(false);
  //   setTempData(prev => ({ ...prev, dashboardManagerContact: "" }));
  // };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-20">
          
          {/* Enhanced Logo Section */}
          <div className="flex items-center space-x-4 -translate-x-[45px] md:translate-x-0">

            <div className="w-12 h-12 invisible sm:visible rounded-2xl flex items-center justify-center shadow-lg">
              {/* <FileText className="w-7 h-7 text-white" /> */}
              <img src="./Logo.png" alt="" className='rounded-xl' />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                FLASHFIRE
              </h1>
              <p className="text-xs text-gray-500 font-medium -mt-1">Complete Workflow Optimization</p>
            </div>
          </div>
          
          {/* Enhanced Navigation Tabs */}
          <div className="flex items-center sm:space-x-2 space-x-0 -translate-x-[30px] md:translate-x-0 p-1">
            <div className="flex">
              {tabs.map(({ id, label, icon: Icon }) => (
                <Link
                  key={id}
                  to="/"
                  onClick={() => onTabChange(id)}
                  className={`flex items-center space-x-4 m-2 p-2 rounded-lg font-semibold transition-all duration-200 ${
                    activeTab === id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{label}</span>
                </Link>
              ))}
            </div>
            
           
            
            {/* Enhanced User Profile Section */}
            {user ? (
              <div className="relative m-2" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropDown(!profileDropDown)}
                  className="flex mr-2 p-3 items-center space-x-2 px-3 pl-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-gray-200"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow">
                    <User className="w-4 h-4 text-white" />
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
                    {/* User Details */}
                    {role == "operations" ? null : (
                      <div className="py-6 space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Email Address
                          </p>
                          <p className="text-sm text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-lg">
                            {userDetails?.email}
                          </p>
                        </div>
                        {/* <div className='flex justify-between'> */}
                        {!hasProfile && (
                          <div
                            className="w-fit"
                            onClick={() =>
                              setUserProfileFormVisibility(
                                true
                              )
                            }
                          >
                            <div className="hover:cursor-pointer inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-50 to-yellow-200 text-amber-700 border-2 border-amber-200">
                              <Edit2Icon className="h-3 w-3 m-2" />{" "}
                              Edit/ Setup Profile
                            </div>
                          </div>
                        )}
                        {/* <Link to="/profile" target="_blank" rel="noopener noreferrer">
  <h1><User2Icon /></h1>
</Link> */}

                        {role == "operations" ? null : (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              Current Plan
                            </p>
                            <div className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-2 border-amber-200">
                              <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                              {userDetails?.planType ||
                                "Free"}
                            </div>
                          </div>
                        )}

                        {/* Dashboard Manager Dropdown - HIDDEN */}
                        {/* {role == "operations" ? null : (
                          <div className="space-y-3">
                            Dashboard Manager section is now hidden
                          </div>
                        )} */}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {role == "operations" ? (
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
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-semibold transition-all duration-200 shadow"
              >
                <User className="w-4 h-4" />
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