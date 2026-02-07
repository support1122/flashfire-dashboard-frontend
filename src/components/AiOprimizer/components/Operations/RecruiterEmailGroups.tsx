import { useEffect, useMemo, useState } from "react";

type GroupSummary = {
  id: string;
  name: string;
  category: string;
  description: string;
  emailsCount: number;
};

type GroupDetail = {
  id: string;
  name: string;
  category: string;
  description: string;
  emails: string[];
};

type Props = {
  apiDashboardBase: string;
  token: string;
};

const categories = ["tech", "non-tech", "medical", "custom"];

function EmailChips({
  emails,
  setEmails
}: {
  emails: string[];
  setEmails: (value: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  const normalizedSet = useMemo(() => {
    return new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean));
  }, [emails]);

  const filtered = useMemo(() => {
    const term = searchEmail.trim().toLowerCase();
    if (!term) return emails;
    return emails.filter((e) => e.toLowerCase().includes(term));
  }, [emails, searchEmail]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const addEmailsFromString = (value: string) => {
    const parts = value
      .split(/[\n,;\s]+/)
      .map((v) => v.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const seen = new Set(normalizedSet);
    const next = [...emails];
    for (const raw of parts) {
      const email = raw.toLowerCase();
      if (!emailRegex.test(raw)) continue;
      if (seen.has(email)) continue;
      seen.add(email);
      next.push(raw);
    }
    if (next.length > emails.length) setEmails(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      if (input.trim()) {
        addEmailsFromString(input);
        setInput("");
      }
    }
  };

  const handleBlur = () => {
    if (input.trim()) {
      addEmailsFromString(input);
      setInput("");
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!pasted || !pasted.trim()) return;
    const trimmed = pasted.trim();
    if (/[\n,]/.test(trimmed) || trimmed.includes("@")) {
      e.preventDefault();
      addEmailsFromString(trimmed);
      setInput("");
    }
  };

  const removeEmail = (target: string) => {
    setEmails(emails.filter((e) => e !== target));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Add emails</label>
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onPaste={handlePaste}
              placeholder="Type or paste emails (e.g. mail1@x.com, mail2@x.com) and press Enter"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="w-full md:w-64">
          <label className="block text-xs font-medium text-gray-700 mb-1">Search emails</label>
          <input
            type="text"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Search inside this group"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      <div className="min-h-[120px] max-h-80 overflow-y-auto rounded-2xl border border-gray-200 bg-white px-3 py-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400">No emails yet. Add one above to get started.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-900 border border-indigo-100"
              >
                <span className="truncate max-w-[160px]">{email}</span>
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 text-[10px]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-gray-500">
        Multiple emails: comma-, space-, or newline-separated. Valid emails only; duplicates ignored. Use search to find and remove.
      </p>
    </div>
  );
}

export default function RecruiterEmailGroups({ apiDashboardBase, token }: Props) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCategory, setNewGroupCategory] = useState("tech");
  const [search, setSearch] = useState("");

  const authFetch = (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = options.headers ? { ...(options.headers as Record<string, string>) } : {};
    headers["Authorization"] = `Bearer ${token}`;
    if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(`${apiDashboardBase}${url}`, { ...options, headers });
  };

  const loadGroups = async () => {
    try {
      setLoadingList(true);
      const res = await authFetch("/admin/recruiter-groups");
      if (!res.ok) return;
      const data = await res.json();
      const list: GroupSummary[] = Array.isArray(data.groups) ? data.groups : [];
      setGroups(list);
      if (!activeGroupId && list.length > 0) {
        setActiveGroupId(list[0].id);
      }
    } finally {
      setLoadingList(false);
    }
  };

  const loadDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const res = await authFetch(`/admin/recruiter-groups/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const d: GroupDetail = data;
      setDetail(d);
      setEmails(Array.isArray(d.emails) ? d.emails : []);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (activeGroupId) {
      loadDetail(activeGroupId);
    } else {
      setDetail(null);
      setEmails([]);
    }
  }, [activeGroupId]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((g) => {
      return (
        g.name.toLowerCase().includes(term) ||
        g.category.toLowerCase().includes(term) ||
        String(g.emailsCount).includes(term)
      );
    });
  }, [groups, search]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      setCreating(true);
      const res = await authFetch("/admin/recruiter-groups", {
        method: "POST",
        body: JSON.stringify({
          name: newGroupName.trim(),
          category: newGroupCategory,
          description: ""
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      const created: GroupSummary = {
        id: data.id,
        name: data.name,
        category: data.category,
        description: data.description || "",
        emailsCount: data.emailsCount || 0
      };
      setGroups((prev) => [created, ...prev]);
      setNewGroupName("");
      setActiveGroupId(created.id);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!detail) return;
    try {
      setSaving(true);
      const res = await authFetch(`/admin/recruiter-groups/${detail.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: detail.name,
          category: detail.category,
          description: detail.description,
          emailsText: emails.join("\n")
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      setGroups((prev) =>
        prev.map((g) =>
          g.id === detail.id
            ? {
                ...g,
                name: data.name,
                category: data.category,
                description: data.description || "",
                emailsCount: data.emailsCount || g.emailsCount
              }
            : g
        )
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-white/40 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-semibold text-gray-900">Recruiter Email Groups</h4>
        <span className="text-xs text-gray-500">
          {groups.length} group{groups.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-3 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="New group name"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <select
                value={newGroupCategory}
                onChange={(e) => setNewGroupCategory(e.target.value)}
                className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateGroup}
              disabled={creating || !newGroupName.trim()}
              className="w-full py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-600 transition-colors"
            >
              {creating ? "Creating..." : "Create Group"}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {loadingList && (
              <div className="text-xs text-gray-500 px-2 py-1">Loading groups...</div>
            )}
            {!loadingList &&
              filteredGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActiveGroupId(g.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
                    g.id === activeGroupId
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{g.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{g.emailsCount}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="uppercase tracking-wide">{g.category}</span>
                  </div>
                </button>
              ))}
            {!loadingList && filteredGroups.length === 0 && (
              <div className="text-xs text-gray-500 px-2 py-1">No groups yet</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {activeGroupId && detail && (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={detail.name}
                    onChange={(e) =>
                      setDetail({
                        ...detail,
                        name: e.target.value
                      })
                    }
                    className="w-full md:w-64 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={detail.category}
                      onChange={(e) =>
                        setDetail({
                          ...detail,
                          category: e.target.value
                        })
                      }
                      className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-500">
                      {emails.length} email{emails.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-600 transition-colors"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <EmailChips emails={emails} setEmails={setEmails} />
            </>
          )}
          {activeGroupId && loadingDetail && (
            <div className="text-xs text-gray-500">Loading group details...</div>
          )}
          {!activeGroupId && (
            <div className="text-sm text-gray-500">Select or create a group to manage recruiter emails.</div>
          )}
        </div>
      </div>
    </div>
  );
}

