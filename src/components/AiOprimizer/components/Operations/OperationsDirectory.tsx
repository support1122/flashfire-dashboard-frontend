import { useEffect, useMemo, useState } from "react";
import { Search, Users, X, Trash2, Pencil } from "lucide-react";
import { toastUtils } from "../../../../utils/toast";

type ManagedUser = { id: string; name: string; email: string };
type OperationUser = { id: string; name: string; email: string; otpEmail?: string | null; managedUsers: ManagedUser[] };

export default function OperationsDirectory() {
  const [ops, setOps] = useState<OperationUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [openOp, setOpenOp] = useState<OperationUser | null>(null);
  const [editOp, setEditOp] = useState<OperationUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", otpEmail: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [opsQuery, setOpsQuery] = useState("");
  const [query, setQuery] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const Api = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8086";

  const fetchOps = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${Api}/admin/operations`, { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load operations");
      setOps(data.operations || []);
    } catch (err: any) {
      console.error(err);
      toastUtils.error(err?.message || "Failed to load operations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOps();
  }, []);

  const filteredManaged = useMemo(() => {
    if (!openOp) return [];
    const q = query.trim().toLowerCase();
    let filtered = openOp.managedUsers;
    if (q) {
      filtered = openOp.managedUsers.filter((u) =>
        (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
      );
    }
    // Sort alphabetically by name (or email if name is not available)
    return [...filtered].sort((a, b) => {
      const nameA = (a.name && a.name.trim()) ? a.name : a.email;
      const nameB = (b.name && b.name.trim()) ? b.name : b.email;
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }, [openOp, query]);

  const handleRemove = async (opId: string, userId: string) => {
    setRemovingId(userId);
    const loadingToast = toastUtils.loading("Removing user...");
    try {
      const res = await fetch(`${Api}/admin/operations/${opId}/managedUsers/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to remove user");
      // Update local state
      setOps((prev) =>
        prev.map((o) =>
          o.id === opId ? { ...o, managedUsers: o.managedUsers.filter((u) => u.id !== userId) } : o
        )
      );
      if (openOp && openOp.id === opId) {
        setOpenOp({ ...openOp, managedUsers: openOp.managedUsers.filter((u) => u.id !== userId) });
      }
      toastUtils.dismissToast(loadingToast);
      toastUtils.success("Removed user from operation");
    } catch (err: any) {
      console.error(err);
      toastUtils.dismissToast(loadingToast);
      toastUtils.error(err?.message || "Failed to remove user");
    } finally {
      setRemovingId(null);
    }
  };

  const visibleOps = useMemo(() => {
    const q = opsQuery.trim().toLowerCase();
    let filtered = ops;
    if (q) {
      filtered = ops.filter((o) => (o.name || "").toLowerCase().includes(q) || (o.email || "").toLowerCase().includes(q));
    }
    // Sort alphabetically by name (or email if name is not available)
    return [...filtered].sort((a, b) => {
      const nameA = (a.name && a.name.trim()) ? a.name : a.email;
      const nameB = (b.name && b.name.trim()) ? b.name : b.email;
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }, [ops, opsQuery]);

  const handleEditOpen = (op: OperationUser) => {
    setEditOp(op);
    setEditForm({
      name: op.name || op.email.split("@")[0] || "",
      otpEmail: op.otpEmail || "",
    });
  };

  const handleEditSave = async () => {
    if (!editOp) return;
    setSavingEdit(true);
    const loadingToast = toastUtils.loading("Saving...");
    try {
      const res = await fetch(`${Api}/admin/operations/${editOp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          otpEmail: editForm.otpEmail.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update");
      setOps((prev) =>
        prev.map((o) =>
          o.id === editOp.id
            ? { ...o, name: editForm.name.trim(), otpEmail: editForm.otpEmail.trim() || null }
            : o
        )
      );
      if (openOp && openOp.id === editOp.id) {
        setOpenOp({ ...openOp, name: editForm.name.trim(), otpEmail: editForm.otpEmail.trim() || null });
      }
      toastUtils.dismissToast(loadingToast);
      toastUtils.success("Operation updated");
      setEditOp(null);
    } catch (err: any) {
      toastUtils.dismissToast(loadingToast);
      toastUtils.error(err?.message || "Failed to update");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleRemoveOp = async (opId: string) => {
    const loadingToast = toastUtils.loading("Removing operations user...");
    try {
      const res = await fetch(`${Api}/admin/operations/${opId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to remove operations user");
      setOps((prev) => prev.filter((o) => o.id !== opId));
      if (openOp && openOp.id === opId) setOpenOp(null);
      toastUtils.dismissToast(loadingToast);
      toastUtils.success("Operations user removed");
    } catch (err: any) {
      console.error(err);
      toastUtils.dismissToast(loadingToast);
      toastUtils.error(err?.message || "Failed to remove operations user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Operations Team</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={opsQuery}
              onChange={(e) => setOpsQuery(e.target.value)}
              placeholder="Search operations by name or email"
              className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchOps}
            className="px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading operations...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleOps.map((op) => (
            <div
              key={op.id}
              className="text-left bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow hover:shadow-md transition p-5 relative group"
            >
              <button
                onClick={() => setOpenOp(op)}
                className="block w-full text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate">{op.name || op.email}</div>
                    <div className="text-sm text-gray-600 truncate">{op.email}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Managed users: {op.managedUsers?.length || 0}</div>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleEditOpen(op); }}
                className="absolute top-3 right-3 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {editOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Operation</h3>
              <button
                onClick={() => setEditOp(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Display name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OTP Email</label>
                <input
                  type="email"
                  value={editForm.otpEmail}
                  onChange={(e) => setEditForm({ ...editForm, otpEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@gmail.com or your@flashfirehq.com"
                />
                <p className="text-xs text-gray-500 mt-1">OTP will be sent to this email at login.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditOp(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={savingEdit}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openOp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">{openOp.name || openOp.email}</div>
                <div className="text-sm text-gray-600">{openOp.email}</div>
                {openOp.otpEmail && (
                  <div className="text-xs text-gray-500 mt-1">OTP email: {openOp.otpEmail}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditOpen(openOp)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleRemoveOp(openOp.id)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove operations user
                </button>
                <button
                  onClick={() => setOpenOp(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search managed users by name or email"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="max-h-96 overflow-auto divide-y divide-gray-100">
              {filteredManaged.length === 0 ? (
                <div className="text-sm text-gray-500 p-3">No users found.</div>
              ) : (
                filteredManaged.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{u.name || u.email}</div>
                      <div className="text-xs text-gray-600 truncate">{u.email}</div>
                    </div>
                    <button
                      onClick={() => handleRemove(openOp.id, u.id)}
                      disabled={removingId === u.id}
                      className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {removingId === u.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


