import React, { useEffect, useMemo, useState } from "react";
import { Mail, Users } from "lucide-react";
import { toastUtils } from "../../../../utils/toast";

interface RegisterFormProps {
    onRegister?: (email: string, password: string) => void;
}

const AddignUser: React.FC<RegisterFormProps> = ({ }) => {
    const [selectedUserEmail, setSelectedUserEmail] = useState("");
    const [selectedOpEmail, setSelectedOpEmail] = useState("");
    const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([]);
    const [ops, setOps] = useState<{ id: string; name: string; email: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingLists, setLoadingLists] = useState(false);
    const [userQuery, setUserQuery] = useState("");
    const [opQuery, setOpQuery] = useState("");

    const Api = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8086";

    const loadLists = async () => {
        setLoadingLists(true);
        try {
            const [uRes, oRes] = await Promise.all([
                fetch(`${Api}/admin/list/users`),
                fetch(`${Api}/admin/list/operations`),
            ]);
            const [uJson, oJson] = await Promise.all([uRes.json(), oRes.json()]);
            if (!uRes.ok) throw new Error(uJson?.error || "Failed to load users");
            if (!oRes.ok) throw new Error(oJson?.error || "Failed to load operations");
            setUsers(uJson.users || []);
            setOps(oJson.operations || []);
        } catch (err: any) {
            console.error(err);
            toastUtils.error(err?.message || "Failed to load lists");
        } finally {
            setLoadingLists(false);
        }
    };

    useEffect(() => { loadLists(); }, []);

    const visibleUsers = useMemo(() => {
        const q = userQuery.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
    }, [users, userQuery]);

    const visibleOps = useMemo(() => {
        const q = opQuery.trim().toLowerCase();
        if (!q) return ops;
        return ops.filter((o) => (o.name || "").toLowerCase().includes(q) || (o.email || "").toLowerCase().includes(q));
    }, [ops, opQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserEmail || !selectedOpEmail) {
            toastUtils.error("Please select a user and an operations member");
            return;
        }
        setLoading(true);
        const loadingToast = toastUtils.loading("Linking user to operations member...");
        try {
            const res = await fetch(`${Api}/admin/assignUserToOperations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUserEmail, operatorEmail: selectedOpEmail }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to link user");
            toastUtils.dismissToast(loadingToast);
            toastUtils.success(data?.message || "Linked successfully");
            setSelectedUserEmail("");
            setSelectedOpEmail("");
        } catch (err: any) {
            console.error(err);
            toastUtils.dismissToast(loadingToast);
            toastUtils.error(err?.message || "Failed to link user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Link Users and Operations team member
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                    <div className="space-y-3">
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Search users by name or email"
                            />
                        </div>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                required
                                value={selectedUserEmail}
                                onChange={(e) => setSelectedUserEmail(e.target.value)}
                                className="w-full pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="" disabled>Select a user</option>
                                {loadingLists ? (
                                    <option value="">Loading users...</option>
                                ) : (
                                    visibleUsers.map((u) => (
                                        <option key={u.id} value={u.email}>
                                            {u.name && u.name.trim() ? `${u.name} (${u.email})` : `Unknown (${u.email})`}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Operations Member</label>
                    <div className="space-y-3">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={opQuery}
                                onChange={(e) => setOpQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Search operations by name or email"
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                required
                                value={selectedOpEmail}
                                onChange={(e) => setSelectedOpEmail(e.target.value)}
                                className="w-full pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="" disabled>Select an operations member</option>
                                {loadingLists ? (
                                    <option value="">Loading operations...</option>
                                ) : (
                                    visibleOps.map((o) => (
                                        <option key={o.id} value={o.email}>
                                            {o.name && o.name.trim() ? `${o.name} (${o.email})` : `Unknown (${o.email})`}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl ${loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                >
                    {loading ? "Linking..." : "Link"}
                </button>
            </form>
        </div>
    );
};

export default AddignUser;
