import { useNavigate } from "react-router-dom";
import ManageHeader from "./ManageHeader";
import ManagedUsers from "./ManagedUsers";
import { useOperationsStore } from "../../state_management/Operations";

export default function ManagePage() {
     const navigate = useNavigate(); // Use the navigate hook
     const reset = useOperationsStore((state) => state.reset);

     const handleLogout = () => {
          reset(); // Reset the operations store
          localStorage.removeItem("Operations-store");
          navigate("/login"); 
     };

     return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
               <ManageHeader
                    onLogout={handleLogout}
               />
               <ManagedUsers />
          </div>
     );
}
