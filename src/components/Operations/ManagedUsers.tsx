import { useContext, useState } from "react";
import { useOperationsStore } from "../../state_management/Operations";
import { useUserProfile } from "../../state_management/ProfileContext";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../state_management/UserContext";

interface LoginResponse {
    message: string;
    token?: string;
    user?: any;
    userDetails?: any;
    userProfile?: any;
    hasProfile?: boolean;
}

export default function ManagedUsers() {
  const managedUsers = useOperationsStore((state) => state.managedUsers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // FIX: Handle cases where user.name might be undefined by defaulting to an empty string.
  const filteredUsers = managedUsers.filter((user) =>
    (user.name || '').toLowerCase().includes(search.toLowerCase())
  );
  
  const context = useContext(UserContext);
  const { setProfileFromApi } = useUserProfile();
  
  if (!context) {
    console.error("UserContext is null");
    return null;
  }
  
  const { setData } = context;

  const navigate = useNavigate();
  const handleOnClick = async (user : any) => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
       const res = await fetch(`${API_BASE_URL}/operations/getUserDetails`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ id: user._id, email: user.email }),
       });
       const data: LoginResponse = await res.json();
       if(data){
        console.log("User details fetched:", data);
        setData({
            userDetails: data?.userDetails,
            token: data?.token || "",
        });
        setProfileFromApi(data.userProfile);
        
        sessionStorage.setItem('hasProfile', data?.hasProfile ? 'true' : 'false');
        
        localStorage.setItem("userAuth", JSON.stringify({
            token: data?.token ?? "",
            userDetails: data?.userDetails ?? null,
            userProfile: data?.userProfile ?? null,
        }));
        navigate("/");
       }

    } catch (error) {
      console.error("Error fetching user details:", error);
      alert("An error occurred while fetching user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-1/2 px-4 py-2 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users Grid */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className={`p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 ${
                loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
              onClick={() => !loading && handleOnClick(user)}
            >
              {/* BONUS: Display email as a fallback if name is missing */}
              <h3 className="text-lg font-semibold text-gray-900">{user.name || user.email}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              {loading && (
                <div className="mt-2 text-sm text-blue-600">Loading...</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No users found.</p>
      )}
    </div>
  );
}