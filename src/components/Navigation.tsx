

import type React from "react"
import { useEffect, useRef, useContext, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Home, Briefcase, FileText, User, LogOut, ChevronDown, Edit2Icon, Mail, CreditCard } from "lucide-react"
import { UserContext } from "../state_management/UserContext.tsx"
import { useUserProfile } from "../state_management/ProfileContext"
import { useOperationsStore } from "../state_management/Operations.ts"
import { toastUtils, toastMessages } from "../utils/toast"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  setUserProfileFormVisibility: any
}

interface TabItem {
  id: string
  label: string
  icon: React.ElementType
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, setUserProfileFormVisibility }) => {
  const navigate = useNavigate()
  const ctx = useContext(UserContext)
  const userDetails = ctx?.userDetails
  const [user, setUser] = useState(userDetails?.name || "")
  const [profileDropDown, setProfileDropDown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { userProfile } = useUserProfile()
  const { role } = useOperationsStore()
  const hasProfile = !!userProfile?.email

  const tabs: TabItem[] = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "jobs", label: "Job Tracker", icon: Briefcase },
    { id: "optimizer", label: "Documents", icon: FileText },
  ]

  useEffect(() => {
    setUser(userDetails?.name || "")
  }, [userDetails])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropDown(false)
      }
    }

    if (profileDropDown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileDropDown])

  const handleSwitchUser = () => {
    localStorage.removeItem("userAuth")
    toastUtils.success("Switching to operations view...")
    navigate("/manage")
  }

  const handleLogout = () => {
    localStorage.clear()
    setUser("")
    toastUtils.success(toastMessages.logoutSuccess)
    navigate("/login")
  }

  const handleLogin = () => {
    navigate("/login")
  }

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="./Logo.png" alt="FLASHFIRE" className="rounded-md w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground tracking-tight">FLASHFIRE</h1>
              <p className="text-[10px] text-muted-foreground font-medium -mt-0.5 tracking-wide uppercase">
                Workflow Optimization
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                to="/"
                onClick={() => onTabChange(id)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden group ${
                  activeTab === id
                    ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-gray border border-border/50 border-blue-500/50 sshadow-md"
                    : "text-muted-foreground hover:text-foreground "
                }`}
              >
                {activeTab !== id && (
                  <div className="absolute inset-0 text-gray bg-gradient-to-r from-blue-700/10 to-blue-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
                <Icon
                  className={`w-4 h-4 relative z-10 transition-colors duration-300 ${activeTab === id ? "text-gray" : "group-hover:text-gray"}`}
                />
                <span
                  className={`hidden sm:block relative z-10 transition-colors duration-300  ${activeTab === id ? "text-gray" : "group-hover:text-gray"}`}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropDown(!profileDropDown)}
                className="relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 border border-border/50 hover:border-blue-500/50 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                  <User className="w-5 h-5 text-gray" />
                
                <div className="hidden md:block text-left relative z-10">
                  <p className="text-sm font-semibold text-foreground leading-none">{user}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1 mt-1">
                    Account Settings
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-300 relative z-10 ${profileDropDown ? "rotate-180" : ""}`}
                />
              </button>

              {profileDropDown && (
                <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-border overflow-hidden z-50 backdrop-blur-none animate-in fade-in slide-in-from-top-2 duration-200">
                  <Link to="/profile" target="_blank" rel="noopener noreferrer">
                    <div className="relative flex items-center gap-4 p-5 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-b border-border hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-950/30 dark:hover:to-red-950/30 transition-all duration-300 group">
                      {/* <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <User className="w-7 h-7 text-white" />
                      </div> */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-foreground truncate">{user}</p>
                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1 mt-0.5">
                          View profile
                          <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                        </p>
                      </div>
                    </div>
                  </Link>

                  {role !== "operations" && (
                    <div className="p-5 space-y-5 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/20">
                      <div className="space-y-2 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-border/50 hover:border-orange-500/30 transition-colors duration-300">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <Mail className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Email Address
                          </p>
                        </div>
                        <p className="text-sm text-foreground font-medium pl-10">{userDetails?.email}</p>
                      </div>

                      {!hasProfile && (
                        <button
                          onClick={() => setUserProfileFormVisibility(true)}
                          className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Edit2Icon className="w-4 h-4" />
                          Setup Profile
                        </button>
                      )}

                      <div className="space-y-2 p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-border/50 hover:border-orange-500/30 transition-colors duration-300">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Current Plan
                          </p>
                        </div>
                        <div className="pl-10">
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            {userDetails?.planType || "Free"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border p-3 bg-gray-50/50 dark:bg-gray-800/30">
                    {role === "operations" ? (
                      <button
                        onClick={handleSwitchUser}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span>Switch Client</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
