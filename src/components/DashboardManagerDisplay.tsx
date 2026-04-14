import React, { useState, useEffect, useContext } from 'react';
import { useUserProfile } from '../state_management/ProfileContext';
import { UserContext } from '../state_management/UserContext';

interface DashboardManager {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  profilePhoto: string;
}

const DashboardManagerDisplay: React.FC = () => {
  const { userProfile } = useUserProfile();
  const { userDetails } = useContext(UserContext);
  const [managerData, setManagerData] = useState<DashboardManager | null>(null);
  const [loading, setLoading] = useState(false);
  const [effectiveManagerName, setEffectiveManagerName] = useState(
    (userProfile?.dashboardManager || userDetails?.dashboardManager || '').trim()
  );

  useEffect(() => {
    const nextName = (userProfile?.dashboardManager || userDetails?.dashboardManager || '').trim();
    setEffectiveManagerName(nextName);
  }, [userProfile?.dashboardManager, userDetails?.dashboardManager]);

  // Fetch manager details when component mounts
  useEffect(() => {
    const fetchManagerDetails = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

        // Pull fresh manager roster and assignment from clients-tracking.
        await fetch(`${API_BASE_URL}/sync/managers`).catch(() => null);

        let managerName = (userProfile?.dashboardManager || userDetails?.dashboardManager || '').trim();
        const currentEmail = (userDetails?.email || userProfile?.email || '').trim();

        if (currentEmail) {
          const userRes = await fetch(`${API_BASE_URL}/get-updated-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentEmail })
          });

          if (userRes.ok) {
            const latestUser = await userRes.json();
            const latestAssignedManager = String(latestUser?.dashboardManager || '').trim();
            if (latestAssignedManager) {
              managerName = latestAssignedManager;
            }
          }
        }

        setEffectiveManagerName(managerName);
        if (!managerName) {
          setManagerData(null);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/dashboard-managers/${encodeURIComponent(managerName)}`);
        if (!response.ok) {
          setManagerData(null);
          return;
        }

        const data = await response.json();
        if (data.success && data.data) {
          setManagerData(data.data);
        } else {
          setManagerData(null);
        }
      } catch (error) {
        console.error('Error fetching manager details:', error);
        setManagerData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchManagerDetails();
  }, [userProfile?.dashboardManager, userDetails?.dashboardManager, userDetails?.email, userProfile?.email]);
  
  // Show fallback if no manager is assigned
  if (!effectiveManagerName) {
    return (
      <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/20">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
          <span className="text-gray-500 text-sm">?</span>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            No Manager Assigned
          </span>
          <span className="text-xs text-gray-500">
            Contact Support
          </span>
        </div>
      </div>
    );
  }

  if (loading && !managerData) {
    return (
      <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/20">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="flex flex-col">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-20 mb-1"></div>
          <div className="h-2 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
      </div>
    );
  }

  if (!managerData) {
    const initials = effectiveManagerName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/20">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-orange-500 text-white flex-shrink-0 flex items-center justify-center text-xs font-semibold">
          {initials || '?'}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            {effectiveManagerName}
          </span>
          <span className="text-xs text-gray-500">
            Your Dashboard Manager
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border border-white/20">
      {/* Manager Photo */}
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        <img
          src={managerData.profilePhoto}
          alt={managerData.fullName}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="w-full h-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">${managerData.fullName.split(' ').map(n => n[0]).join('')}</div>`;
            }
          }}
        />
      </div>

      {/* Manager Name */}
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium text-gray-900">
          {managerData.fullName}
        </span>
        <span className="text-xs text-gray-500">
          Your Dashboard Manager
        </span>
      </div>
    </div>
  );
};

export default DashboardManagerDisplay;
