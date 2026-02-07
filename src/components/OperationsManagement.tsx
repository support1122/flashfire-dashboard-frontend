import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Calendar, Lock, X, ChevronDown, ChevronUp, Edit2, Mail, Paperclip, Send, MessageSquare, Link2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserContext } from '../state_management/UserContext.tsx';
import { toastUtils, toastMessages } from '../utils/toast.ts';
import { useOperationsStore } from '../state_management/Operations.ts';
import SecretKeyModal from './SecretKeyModal.tsx';

interface Todo {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LockPeriod {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt?: string;
}

interface ClientOperationsData {
  todos: Todo[];
  lockPeriods: LockPeriod[];
}

const OperationsManagement = () => {
  const { userDetails, token } = useContext(UserContext) || {};
  const { role, name: operatorName } = useOperationsStore();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [lockPeriods, setLockPeriods] = useState<LockPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoNotes, setNewTodoNotes] = useState('');
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [expandedTodos, setExpandedTodos] = useState<Set<string>>(new Set());
  const [editingTodoNotes, setEditingTodoNotes] = useState<{ id: string; notes: string } | null>(null);
  const [newLockPeriod, setNewLockPeriod] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [showAddLockPeriod, setShowAddLockPeriod] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeSection, setActiveSection] = useState<"operations" | "email" | "whatsapp">("operations");
  const [gmailStatus, setGmailStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    text: ""
  });
  const [sending, setSending] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [whatsappGroups, setWhatsappGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [linkingUser, setLinkingUser] = useState(false);
  const [userGroupMapping, setUserGroupMapping] = useState<any>(null);
  const [whatsappUnlocked, setWhatsappUnlocked] = useState(false);
  const [showWhatsappSecretModal, setShowWhatsappSecretModal] = useState(false);
  const [whatsappSecretError, setWhatsappSecretError] = useState('');
  const [emailUnlocked, setEmailUnlocked] = useState(false);
  const [showEmailSecretModal, setShowEmailSecretModal] = useState(false);
  const [emailSecretError, setEmailSecretError] = useState('');
  const [emailGroups, setEmailGroups] = useState<{ id: string; name: string; category: string }[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<{ id: string; name: string; subject: string }[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [automationGroupId, setAutomationGroupId] = useState<string>('');
  const [automationDailyLimit, setAutomationDailyLimit] = useState<string>('0');
  const [automationEnabled, setAutomationEnabled] = useState<boolean>(false);
  const [loadingAutomation, setLoadingAutomation] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [selectedTemplateIdForEdit, setSelectedTemplateIdForEdit] = useState<string | null>(null);
  const [loadingTemplateForEdit, setLoadingTemplateForEdit] = useState(false);
  const [emailLogs, setEmailLogs] = useState<{ id: string; fromEmail: string; toEmail: string; subject: string; status: string; errorMessage: string | null; source: string; sentAt: string }[]>([]);
  const [emailLogsTotal, setEmailLogsTotal] = useState(0);
  const [emailLogsPage, setEmailLogsPage] = useState(1);
  const [emailLogsLimit, setEmailLogsLimit] = useState(20);
  const [emailLogsTotalPages, setEmailLogsTotalPages] = useState(0);
  const [loadingEmailLogs, setLoadingEmailLogs] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Only allow operations role
  if (role !== 'operations') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">This page is only available to operations team members.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (userDetails?.email) {
      fetchClientOperations();
      fetchUserGroupMapping();
    }
  }, [userDetails?.email]);

  useEffect(() => {
    if (activeSection === "whatsapp" && whatsappGroups.length === 0) {
      fetchWhatsAppGroups();
    }
  }, [activeSection]);

  const fetchClientOperations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/operations/client-operations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: userDetails?.email
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setTodos(result.data.todos || []);
        setLockPeriods(result.data.lockPeriods || []);
      } else {
        // toastUtils.error('Failed to load operations data');
      }
    } catch (error) {
      console.error('Error fetching client operations:', error);
      // toastUtils.error('Failed to load operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadGmailState = async () => {
      try {
        if (!userDetails?.email) return;
        const statusRes = await fetch(`${API_BASE_URL}/gmail/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email: userDetails.email })
        });
        if (!statusRes.ok) {
          setGmailStatus("disconnected");
        } else {
          const statusJson = await statusRes.json();
          setGmailStatus(statusJson.connected ? "connected" : "disconnected");
        }
        const accountsRes = await fetch(`${API_BASE_URL}/gmail/accounts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email: userDetails.email })
        });
        if (accountsRes.ok) {
          const accountsJson = await accountsRes.json();
          const accounts = (accountsJson.accounts || []).map((a: { email: string }) => a.email);
          setAvailableAccounts(accounts);
          setSelectedAccounts(accounts);
        }
      } catch {
        setGmailStatus("disconnected");
      }
    };
    loadGmailState();
  }, [API_BASE_URL, userDetails?.email]);

  useEffect(() => {
    const loadEmailMetadata = async () => {
      try {
        if (!userDetails?.email) return;
        setLoadingAutomation(true);
        const [groupsRes, templatesRes, configRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/recruiter-groups`),
          fetch(`${API_BASE_URL}/gmail/templates`),
          fetch(`${API_BASE_URL}/gmail/automation/config/get`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ ownerEmail: userDetails.email })
          })
        ]);
        if (groupsRes.ok) {
          const data = await groupsRes.json();
          const list = Array.isArray(data.groups) ? data.groups : [];
          setEmailGroups(list.map((g: any) => ({ id: g.id, name: g.name, category: g.category })));
        }
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          const list = Array.isArray(data.templates) ? data.templates : [];
          setEmailTemplates(list);
        }
        if (configRes.ok) {
          const data = await configRes.json();
          if (data.config) {
            setAutomationGroupId(data.config.groupId || '');
            setSelectedTemplateId(data.config.templateId || '');
            setAutomationDailyLimit(String(data.config.dailyLimit || '0'));
            setAutomationEnabled(!!data.config.enabled);
          }
        }
      } finally {
        setLoadingAutomation(false);
      }
    };
    if (gmailStatus === "connected") {
      loadEmailMetadata();
    }
  }, [API_BASE_URL, gmailStatus, userDetails?.email]);

  // Auto-save function with debouncing
  const autoSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const opsName = operatorName || 'operations';
        const response = await fetch(`${API_BASE_URL}/operations/client-operations`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientEmail: userDetails?.email,
            todos,
            lockPeriods,
            operatorName: opsName
          }),
        });

        const result = await response.json();
        if (result.success) {
          // Silent save - no toast notification for auto-save
        } else {
          console.error('Auto-save failed:', result.message);
        }
      } catch (error) {
        console.error('Error auto-saving client operations:', error);
      } finally {
        setSaving(false);
      }
    }, 1000); // Debounce for 1 second
  }, [todos, lockPeriods, userDetails?.email, operatorName, API_BASE_URL]);

  // Auto-save whenever todos or lockPeriods change
  useEffect(() => {
    if (!loading && userDetails?.email) {
      autoSave();
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [todos, lockPeriods, loading, userDetails?.email, autoSave]);

  const toggleTodo = (todoId: string) => {
    setTodos(todos.map(todo =>
      todo.id === todoId
        ? { ...todo, completed: !todo.completed, updatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
        : todo
    ));
  };

  const addTodo = () => {
    if (!newTodoTitle.trim()) return;

    const opsName = operatorName || 'operations';
    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      title: newTodoTitle.trim(),
      notes: newTodoNotes.trim() || '',
      completed: false,
      createdBy: opsName,
      createdAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      updatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    setTodos([...todos, newTodo]);
    setNewTodoTitle('');
    setNewTodoNotes('');
    setShowAddTodo(false);
  };

  const toggleTodoExpanded = (todoId: string) => {
    const newExpanded = new Set(expandedTodos);
    if (newExpanded.has(todoId)) {
      newExpanded.delete(todoId);
    } else {
      newExpanded.add(todoId);
    }
    setExpandedTodos(newExpanded);
  };

  const startEditingNotes = (todo: Todo) => {
    setEditingTodoNotes({ id: todo.id, notes: todo.notes || '' });
  };

  const saveTodoNotes = (todoId: string) => {
    if (editingTodoNotes && editingTodoNotes.id === todoId) {
      setTodos(todos.map(todo =>
        todo.id === todoId
          ? { ...todo, notes: editingTodoNotes.notes, updatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
          : todo
      ));
      setEditingTodoNotes(null);
    }
  };

  const cancelEditingNotes = () => {
    setEditingTodoNotes(null);
  };

  const deleteTodo = (todoId: string) => {
    setTodos(todos.filter(todo => todo.id !== todoId));
  };

  const addLockPeriod = () => {
    if (!newLockPeriod.startDate || !newLockPeriod.endDate) {
      toastUtils.error('Please select both start and end dates');
      return;
    }

    const startDate = new Date(newLockPeriod.startDate);
    const endDate = new Date(newLockPeriod.endDate);

    if (endDate < startDate) {
      toastUtils.error('End date must be after start date');
      return;
    }

    const newPeriod: LockPeriod = {
      id: `lock-${Date.now()}`,
      startDate: newLockPeriod.startDate,
      endDate: newLockPeriod.endDate,
      reason: newLockPeriod.reason || '',
      createdAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };

    setLockPeriods([...lockPeriods, newPeriod]);
    setNewLockPeriod({ startDate: '', endDate: '', reason: '' });
    setShowAddLockPeriod(false);
  };

  const deleteLockPeriod = (periodId: string) => {
    setLockPeriods(lockPeriods.filter(period => period.id !== periodId));
  };

  const handleAttachmentChange = (file: File | null) => {
    if (!file) {
      setAttachment(null);
      return;
    }
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      toastUtils.error("File size exceeds 25MB limit");
      return;
    }
    setAttachment(file);
  };

  const loadTemplateForEdit = async (id: string) => {
    try {
      setLoadingTemplateForEdit(true);
      const res = await fetch(`${API_BASE_URL}/gmail/templates/${id}`);
      const data = await res.json();
      if (!res.ok) {
        toastUtils.error(data.error || "Failed to load template");
        return;
      }
      setEmailForm(prev => ({
        ...prev,
        subject: data.subject || "",
        text: data.text || ""
      }));
      setTemplateName(data.name || "");
      setSelectedTemplateIdForEdit(id);
    } catch (error) {
      toastUtils.error("Failed to load template");
    } finally {
      setLoadingTemplateForEdit(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!userDetails?.email) {
      toastUtils.error("Missing client email");
      return;
    }
    if (!templateName.trim()) {
      toastUtils.error("Template name is required");
      return;
    }
    if (!emailForm.subject.trim() || !emailForm.text.trim()) {
      toastUtils.error("Subject and message are required");
      return;
    }
    try {
      setSavingTemplate(true);
      const formData = new FormData();
      formData.append("ownerEmail", userDetails.email);
      formData.append("name", templateName.trim());
      formData.append("subject", emailForm.subject.trim());
      formData.append("text", emailForm.text.trim());
      if (attachment) {
        formData.append("attachment", attachment);
      }
      if (selectedTemplateIdForEdit) {
        const res = await fetch(`${API_BASE_URL}/gmail/templates/${selectedTemplateIdForEdit}`, {
          method: "PUT",
          body: formData
        });
        const data = await res.json();
        if (!res.ok) {
          toastUtils.error(data.error || "Failed to update template");
          return;
        }
        setEmailTemplates(prev =>
          prev.map(t => t.id === selectedTemplateIdForEdit ? { id: t.id, name: data.name, subject: data.subject } : t)
        );
        setSelectedTemplateIdForEdit(null);
        toastUtils.success("Template updated");
      } else {
        const res = await fetch(`${API_BASE_URL}/gmail/templates`, {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (!res.ok) {
          toastUtils.error(data.error || "Failed to save template");
          return;
        }
        const created = { id: data.id, name: data.name, subject: data.subject };
        setEmailTemplates(prev => [created, ...prev]);
        setSelectedTemplateId(created.id);
        toastUtils.success("Template saved");
      }
    } catch (error) {
      toastUtils.error(selectedTemplateIdForEdit ? "Failed to update template" : "Failed to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSaveAutomation = async () => {
    if (!userDetails?.email) {
      toastUtils.error("Missing client email");
      return;
    }
    if (!automationGroupId) {
      toastUtils.error("Please select a group");
      return;
    }
    if (!selectedTemplateId) {
      toastUtils.error("Please select a template");
      return;
    }
    const limitNumber = Number(automationDailyLimit || 0);
    if (!Number.isFinite(limitNumber) || limitNumber <= 0) {
      toastUtils.error("Daily limit must be greater than zero");
      return;
    }
    try {
      setSavingAutomation(true);
      const res = await fetch(`${API_BASE_URL}/gmail/automation/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ownerEmail: userDetails.email,
          groupId: automationGroupId,
          templateId: selectedTemplateId,
          dailyLimit: limitNumber,
          enabled: automationEnabled
        })
      });
      const data = await res.json();
      if (!res.ok) {
        toastUtils.error(data.error || "Failed to save automation");
        return;
      }
      toastUtils.success("Automation settings saved");
    } catch (error) {
      toastUtils.error("Failed to save automation");
    } finally {
      setSavingAutomation(false);
    }
  };

  const fetchEmailLogs = useCallback(async (overridePage?: number) => {
    if (!userDetails?.email) return;
    const page = overridePage ?? emailLogsPage;
    try {
      setLoadingEmailLogs(true);
      const res = await fetch(`${API_BASE_URL}/gmail/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerEmail: userDetails.email,
          page,
          limit: emailLogsLimit
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailLogs([]);
        return;
      }
      setEmailLogs(data.logs || []);
      setEmailLogsTotal(data.total ?? 0);
      setEmailLogsTotalPages(data.totalPages ?? 0);
      if (overridePage !== undefined) setEmailLogsPage(overridePage);
    } catch {
      setEmailLogs([]);
    } finally {
      setLoadingEmailLogs(false);
    }
  }, [API_BASE_URL, userDetails?.email, emailLogsPage, emailLogsLimit]);

  useEffect(() => {
    if (activeSection === "email" && userDetails?.email) {
      fetchEmailLogs();
    }
  }, [activeSection, userDetails?.email, emailLogsPage, emailLogsLimit, fetchEmailLogs]);

  const toggleAccountSelection = (email: string) => {
    setSelectedAccounts(prev => {
      if (prev.includes(email)) {
        return prev.filter(e => e !== email);
      }
      return [...prev, email];
    });
  };

  const fetchWhatsAppGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/groups`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (result.success && result.data) {
        // Sort WhatsApp groups so they appear in clean ascending order
        const sortedGroups = [...result.data].sort(
          (a: { name?: string }, b: { name?: string }) => {
            const nameA = (a?.name || '').trim();
            const nameB = (b?.name || '').trim();
            return nameA.localeCompare(nameB, undefined, {
              numeric: true,
              sensitivity: 'base',
            });
          }
        );
        setWhatsappGroups(sortedGroups);
        if (userGroupMapping && userGroupMapping.groupId) {
          setSelectedGroup(userGroupMapping.groupId);
        }
      } else {
        toastUtils.error(result.message || 'Failed to load WhatsApp groups');
      }
    } catch (error) {
      console.error('Error fetching WhatsApp groups:', error);
      toastUtils.error('Failed to load WhatsApp groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchUserGroupMapping = async () => {
    try {
      if (!userDetails?.email) return;
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/user-mapping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userDetails.email
        }),
      });

      const result = await response.json();
      if (result.success && result.data) {
        setUserGroupMapping(result.data);
        setSelectedGroup(result.data.groupId);
      }
    } catch (error) {
      console.error('Error fetching user group mapping:', error);
    }
  };

  const handleLinkUserToGroup = async () => {
    if (!selectedGroup) {
      toastUtils.error('Please select a WhatsApp group');
      return;
    }

    if (!userDetails?.email) {
      toastUtils.error('User email not found');
      return;
    }

    try {
      setLinkingUser(true);
      const selectedGroupData = whatsappGroups.find(g => g.id === selectedGroup);
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/link-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userDetails.email,
          groupId: selectedGroup,
          groupName: selectedGroupData?.name || '',
          linkedBy: operatorName || 'operations'
        }),
      });

      const result = await response.json();
      if (result.success) {
        toastUtils.success('User linked to WhatsApp group successfully');
        setUserGroupMapping(result.data);
      } else {
        toastUtils.error(result.message || 'Failed to link user to group');
      }
    } catch (error) {
      console.error('Error linking user to group:', error);
      toastUtils.error('Failed to link user to group');
    } finally {
      setLinkingUser(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      if (!userDetails?.email) {
        toastUtils.error("Missing client email");
        return;
      }
      if (!emailForm.to.trim() || !emailForm.subject.trim() || !emailForm.text.trim()) {
        toastUtils.error("To, subject and message are required");
        return;
      }
      if (gmailStatus !== "connected" || availableAccounts.length === 0) {
        toastUtils.error("Client has not connected Gmail yet");
        return;
      }
      setSending(true);
      setEmailResult(null);
      const formData = new FormData();
      formData.append("ownerEmail", userDetails.email);
      formData.append("to", emailForm.to.trim());
      formData.append("subject", emailForm.subject.trim());
      formData.append("text", emailForm.text.trim());
      const fromList = selectedAccounts.length > 0 ? selectedAccounts : availableAccounts;
      fromList.forEach(email => {
        formData.append("fromEmails", email);
      });
      if (attachment) {
        formData.append("attachment", attachment);
      }
      const res = await fetch(`${API_BASE_URL}/gmail/send`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        toastUtils.error(data.error || "Failed to send emails");
        setEmailResult(null);
        return;
      }
      const lines: string[] = [];
      const sent = data.sent || 0;
      const total = data.total || 0;
      lines.push(`Results: ${sent}/${total} emails sent successfully`);
      if (data.attachment) {
        lines.push(`Attachment: ${data.attachment}`);
      }
      const results = data.results || [];
      results.forEach((r: { email: string; status: string; error?: string }) => {
        if (r.status === "sent") {
          lines.push(`✔ ${r.email}: Sent successfully`);
        } else {
          lines.push(`✖ ${r.email}: ${r.error || "Failed"}`);
        }
      });
      setEmailResult(lines.join("\n"));
      toastUtils.success("Emails processed");
      fetchEmailLogs(1);
    } catch (error) {
      console.error(error);
      toastUtils.error("Failed to send emails");
      setEmailResult(null);
    } finally {
      setSending(false);
    }
  };

  const isDateInLockPeriod = (date: Date) => {
    return lockPeriods.some(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return date >= start && date <= end;
    });
  };

  const getActiveLockPeriod = () => {
    const now = new Date();
    return lockPeriods.find(period => {
      const start = new Date(period.startDate);
      const end = new Date(period.endDate);
      return now >= start && now <= end;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading operations data...</p>
        </div>
      </div>
    );
  }

  const activeLockPeriod = getActiveLockPeriod();

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h2 className="text-4xl md:text-4xl font-extrabold text-zinc-900 mb-2 tracking-tight leading-[1.1]">
            Operations Management
          </h2>
          <p className="text-gray-600 text-lg">
            Manage client TODOs, lock periods, and send recruiter emails
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setActiveSection("operations")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeSection === "operations"
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>TODOs & Lock Periods</span>
          </button>
          <button
            onClick={() => {
              setActiveSection("email");
              if (!emailUnlocked) {
                setShowEmailSecretModal(true);
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeSection === "email"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Send Emails to Recruiters</span>
            {!emailUnlocked && (
              <Lock className="w-3 h-3 text-gray-500" />
            )}
          </button>
          <button
            onClick={() => {
              if (!whatsappUnlocked) {
                setShowWhatsappSecretModal(true);
              } else {
                setActiveSection("whatsapp");
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeSection === "whatsapp"
                ? "bg-green-600 text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Notifications</span>
            {!whatsappUnlocked && (
              <Lock className="w-3 h-3 text-gray-500" />
            )}
          </button>
        </div>

        {activeSection === "operations" && (
          <>
            {activeLockPeriod && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <Lock className="w-5 h-5 text-red-500 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800">Lock Period Active</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Job cards cannot be moved from "Saved" to "Applied" until{" "}
                      {new Date(activeLockPeriod.endDate).toLocaleDateString()}
                      {activeLockPeriod.reason && ` - ${activeLockPeriod.reason}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TODOs Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">TODOs</h3>
              <button
                onClick={() => setShowAddTodo(!showAddTodo)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add TODO
              </button>
            </div>

            {/* Add TODO Form */}
            {showAddTodo && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="text"
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && addTodo()}
                  placeholder="Enter TODO title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-3"
                  autoFocus
                />
                <textarea
                  value={newTodoNotes}
                  onChange={(e) => setNewTodoNotes(e.target.value)}
                  placeholder="Add notes (optional)..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addTodo}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTodo(false);
                      setNewTodoTitle('');
                      setNewTodoNotes('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* TODOs List */}
            <div className="space-y-3">
              {todos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No TODOs yet. Add one to get started!</p>
              ) : (
                todos.map((todo) => {
                  const isExpanded = expandedTodos.has(todo.id);
                  const isEditing = editingTodoNotes?.id === todo.id;
                  const hasNotes = todo.notes && todo.notes.trim().length > 0;

                  return (
                    <div
                      key={todo.id}
                      className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group border border-gray-200"
                    >
                      <div className="flex items-center gap-3 p-3">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className="flex-shrink-0"
                          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      <div className="flex-1">
                        <div
                          className="cursor-pointer"
                          onClick={() => toggleTodoExpanded(todo.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm flex-1 ${
                                todo.completed
                                  ? 'text-gray-500 line-through'
                                  : 'text-gray-900 font-medium'
                              }`}
                            >
                              {todo.title}
                            </span>
                            {hasNotes && (
                              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                                Has notes
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {todo.createdBy && (
                              <span className="text-xs text-gray-500">
                                Created by {todo.createdBy}
                              </span>
                            )}
                            {hasNotes && !isExpanded && (
                              <span className="text-xs text-gray-500">•</span>
                            )}
                            {hasNotes && !isExpanded && (
                              <p className="text-xs text-gray-500 line-clamp-1">
                                {todo.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                        {/* <button
                          onClick={() => deleteTodo(todo.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                          aria-label="Delete TODO"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button> */}
                      </div>

                      {/* Expanded Notes Section */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-0 border-t border-gray-200 mt-2">
                          {isEditing ? (
                            <div className="mt-3 space-y-2">
                              <textarea
                                value={editingTodoNotes.notes}
                                onChange={(e) => setEditingTodoNotes({ ...editingTodoNotes, notes: e.target.value })}
                                placeholder="Add notes..."
                                rows={4}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveTodoNotes(todo.id)}
                                  className="px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingNotes}
                                  className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3">
                              {hasNotes ? (
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200 min-h-[60px]">
                                    {todo.notes}
                                  </p>
                                  <button
                                    onClick={() => startEditingNotes(todo)}
                                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    Edit notes
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => startEditingNotes(todo)}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 font-medium"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add notes
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Lock Periods Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Lock Periods</h3>
              <button
                onClick={() => setShowAddLockPeriod(!showAddLockPeriod)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Period
              </button>
            </div>

            {/* Add Lock Period Form */}
            {showAddLockPeriod && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newLockPeriod.startDate}
                      onChange={(e) => setNewLockPeriod({ ...newLockPeriod, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={newLockPeriod.endDate}
                      onChange={(e) => setNewLockPeriod({ ...newLockPeriod, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                    <input
                      type="text"
                      value={newLockPeriod.reason}
                      onChange={(e) => setNewLockPeriod({ ...newLockPeriod, reason: e.target.value })}
                      placeholder="Enter reason for lock period..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={addLockPeriod}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddLockPeriod(false);
                      setNewLockPeriod({ startDate: '', endDate: '', reason: '' });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Lock Periods List */}
            <div className="space-y-3">
              {lockPeriods.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No lock periods set. Add one to restrict job card movement.</p>
              ) : (
                lockPeriods.map((period) => {
                  const isActive = isDateInLockPeriod(new Date());
                  const startDate = new Date(period.startDate);
                  const endDate = new Date(period.endDate);
                  const isActivePeriod = new Date() >= startDate && new Date() <= endDate;

                  return (
                    <div
                      key={period.id}
                      className={`p-4 rounded-lg border ${
                        isActivePeriod
                          ? 'bg-red-50 border-red-300'
                          : 'bg-gray-50 border-gray-200'
                      } group`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                            </span>
                            {isActivePeriod && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded">
                                Active
                              </span>
                            )}
                          </div>
                          {period.reason && (
                            <p className="text-sm text-gray-600 mt-1">{period.reason}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteLockPeriod(period.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                          aria-label="Delete lock period"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
            </div>
          </>
        )}

        {activeSection === "email" && !emailUnlocked && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 mb-6">
                <Lock className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Send Emails to Recruiters Locked
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Enter the secret key to access recruiter email sending
              </p>
              <button
                onClick={() => setShowEmailSecretModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all shadow-md"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock Send Emails</span>
              </button>
            </div>
          </div>
        )}

        {activeSection === "email" && emailUnlocked && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <span>Send Emails to Recruiters</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Use the client&apos;s connected Gmail accounts to send personalized outreach.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {gmailStatus === "connected" && availableAccounts.length > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {availableAccounts.length} Gmail account(s) connected
                  </span>
                )}
                {gmailStatus !== "connected" && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 border border-red-200">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Client has not connected Gmail yet
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To (comma separated)
                  </label>
                  <input
                    type="text"
                    value={emailForm.to}
                    onChange={(e) =>
                      setEmailForm((prev) => ({ ...prev, to: e.target.value }))
                    }
                    placeholder="recruiter1@example.com, recruiter2@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) =>
                      setEmailForm((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    placeholder="Subject line"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={emailForm.text}
                    onChange={(e) =>
                      setEmailForm((prev) => ({ ...prev, text: e.target.value }))
                    }
                    rows={8}
                    placeholder="Write a clear, personalized message to the recruiter..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span>Attach file (optional)</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                        onChange={(e) => handleAttachmentChange(e.target.files?.[0] || null)}
                      />
                    </label>
                    {attachment && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="truncate max-w-[160px]">{attachment.name}</span>
                        <button
                          onClick={() => setAttachment(null)}
                          className="p-1 rounded-full hover:bg-gray-100"
                          aria-label="Remove attachment"
                        >
                          <X className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Template name"
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        onClick={handleSaveTemplate}
                        disabled={savingTemplate}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                          savingTemplate
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                        }`}
                      >
                        {savingTemplate ? "Saving..." : "Save Template"}
                      </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={sending || gmailStatus !== "connected" || !availableAccounts.length}
                      className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold shadow-md transition-all ${
                        sending || gmailStatus !== "connected" || !availableAccounts.length
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      {sending ? "Sending..." : "Send Emails"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    From accounts
                  </h4>
                  {availableAccounts.length === 0 ? (
                    <p className="text-xs text-gray-600">
                      No Gmail accounts connected for this client. Ask the client to open
                      their profile and connect Gmail first.
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-600 mb-3">
                        Select which connected Gmail accounts to send from. Leave all
                        selected to send from every available account.
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {availableAccounts.map((email) => (
                          <label
                            key={email}
                            className="flex items-center gap-2 text-sm text-gray-800 bg-white rounded-md px-2 py-1 border border-gray-200 hover:border-indigo-400"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                              checked={selectedAccounts.includes(email)}
                              onChange={() => toggleAccountSelection(email)}
                            />
                            <span className="truncate">{email}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Automation
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Status</span>
                      <button
                        type="button"
                        onClick={() => setAutomationEnabled((v) => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          automationEnabled ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            automationEnabled ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <span className="text-xs text-gray-700">
                        {automationEnabled ? "On" : "Off"}
                      </span>
                    </div>
                  </div>
                  {loadingAutomation ? (
                    <p className="text-xs text-gray-500">Loading automation data...</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">
                          Select group
                        </label>
                        <select
                          value={automationGroupId}
                          onChange={(e) => setAutomationGroupId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Choose group</option>
                          {emailGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.category})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">
                          Select template
                        </label>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => setSelectedTemplateId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Choose template</option>
                          {emailTemplates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-700">
                          How many emails per day
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={automationDailyLimit}
                          onChange={(e) => setAutomationDailyLimit(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Example: 25"
                        />
                      </div>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleSaveAutomation}
                          disabled={savingAutomation || loadingAutomation}
                          className={`inline-flex items-center justify-center w-full px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors ${
                            savingAutomation || loadingAutomation
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          {savingAutomation ? "Saving..." : "Save Automation Settings"}
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Emails are sent once per day at 11:00 PM IST to random recipients from the
                        selected group without repeating until the list is exhausted.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Delivery status
                  </h4>
                  {emailResult ? (
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap max-h-52 overflow-y-auto bg-gray-50 rounded-md p-3 border border-gray-100">
                      {emailResult}
                    </pre>
                  ) : (
                    <p className="text-xs text-gray-600">
                      Status of the most recent email send will appear here, including which
                      Gmail accounts succeeded or failed.
                    </p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Saved templates
                  </h4>
                  {selectedTemplateIdForEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplateIdForEdit(null);
                        setTemplateName("");
                        setEmailForm(prev => ({ ...prev, subject: "", text: "" }));
                        setAttachment(null);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      New template
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Click a template to open it in the form above. Edit and click Save Template to update.
                </p>
                {loadingTemplateForEdit ? (
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading template...
                  </p>
                ) : emailTemplates.length === 0 ? (
                  <p className="text-xs text-gray-500">No saved templates yet. Save one using the form above.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {emailTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => loadTemplateForEdit(t.id)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                          selectedTemplateIdForEdit === t.id
                            ? "bg-indigo-50 border-indigo-300 text-indigo-800 font-medium"
                            : "bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50"
                        }`}
                      >
                        <span>{t.name}</span>
                        {t.subject && (
                          <span className="text-xs text-gray-500 truncate max-w-[120px]" title={t.subject}>
                            — {t.subject}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-600" />
                Email send logs
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Per-recipient send history for this client. Manual and automated sends are both recorded.
              </p>
              {loadingEmailLogs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & time</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {emailLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                              No send logs yet for this client.
                            </td>
                          </tr>
                        ) : (
                          emailLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {new Date(log.sentAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[140px]" title={log.fromEmail}>{log.fromEmail}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[140px]" title={log.toEmail}>{log.toEmail}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 truncate max-w-[180px]" title={log.subject}>{log.subject}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${log.source === "automation" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
                                  {log.source}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${log.status === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                  {log.status === "success" ? "Success" : "Failed"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-red-600 max-w-[200px] truncate" title={log.errorMessage || ""}>
                                {log.errorMessage || "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {emailLogsTotalPages > 0 && (
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Rows per page</span>
                        <select
                          value={emailLogsLimit}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setEmailLogsLimit(v);
                            setEmailLogsPage(1);
                          }}
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                        >
                          {[10, 20, 50, 100].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <span className="text-gray-500">
                          {emailLogsTotal === 0 ? "0" : (emailLogsPage - 1) * emailLogsLimit + 1}–{Math.min(emailLogsPage * emailLogsLimit, emailLogsTotal)} of {emailLogsTotal}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEmailLogsPage((p) => Math.max(1, p - 1))}
                          disabled={emailLogsPage <= 1}
                          className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-3 text-sm text-gray-700">
                          Page {emailLogsPage} of {emailLogsTotalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEmailLogsPage((p) => Math.min(emailLogsTotalPages, p + 1))}
                          disabled={emailLogsPage >= emailLogsTotalPages}
                          className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeSection === "whatsapp" && whatsappUnlocked && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <span>WhatsApp Group Notifications</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Link the client to a WhatsApp group to receive notifications when job cards are added.
                </p>
              </div>
              {userGroupMapping && (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 border border-green-200">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Linked to: {userGroupMapping.groupName || userGroupMapping.groupId}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select WhatsApp Group
                </label>
                <div className="flex gap-3">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    disabled={loadingGroups || linkingUser}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
                  >
                    <option value="">Choose a group...</option>
                    {whatsappGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={fetchWhatsAppGroups}
                    disabled={loadingGroups}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                  >
                    {loadingGroups ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Refresh</span>
                    )}
                  </button>
                </div>
                {loadingGroups && (
                  <p className="text-xs text-gray-500 mt-1">Loading groups...</p>
                )}
              </div>

              {selectedGroup && (
                <div>
                  <button
                    onClick={handleLinkUserToGroup}
                    disabled={linkingUser || !selectedGroup}
                    className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold shadow-md transition-all ${
                      linkingUser || !selectedGroup
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {linkingUser ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Linking...</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        <span>Link User to This Group</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {userGroupMapping && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Current Mapping
                  </h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Group:</span> {userGroupMapping.groupName || userGroupMapping.groupId}</p>
                    <p><span className="font-medium">Linked at:</span> {userGroupMapping.linkedAt}</p>
                    {userGroupMapping.linkedBy && (
                      <p><span className="font-medium">Linked by:</span> {userGroupMapping.linkedBy}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "whatsapp" && !whatsappUnlocked && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-100 to-emerald-100 mb-6">
                <Lock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                WhatsApp Notifications Locked
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Please enter the secret key to access WhatsApp notifications
              </p>
              <button
                onClick={() => setShowWhatsappSecretModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all shadow-md"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* Auto-save indicator */}
        {saving && (
          <div className="mt-6 flex justify-end">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
              <span>Saving...</span>
            </div>
          </div>
        )}
      </div>

      <SecretKeyModal
        isOpen={showWhatsappSecretModal}
        onClose={() => {
          setShowWhatsappSecretModal(false);
          setWhatsappSecretError('');
        }}
        onConfirm={(secretKey) => {
          if (secretKey !== "flashfire@2025") {
            setWhatsappSecretError("Incorrect secret key. Please try again.");
            return;
          }
          setWhatsappUnlocked(true);
          setShowWhatsappSecretModal(false);
          setWhatsappSecretError('');
          setActiveSection("whatsapp");
        }}
        error={whatsappSecretError}
      />
      <SecretKeyModal
        isOpen={showEmailSecretModal}
        onClose={() => {
          setShowEmailSecretModal(false);
          setEmailSecretError('');
        }}
        onConfirm={(secretKey) => {
          if (secretKey !== "flashfire@2025") {
            setEmailSecretError("Incorrect secret key. Please try again.");
            return;
          }
          setEmailUnlocked(true);
          setShowEmailSecretModal(false);
          setEmailSecretError('');
        }}
        error={emailSecretError}
      />
    </div>
  );
};

export default OperationsManagement;

