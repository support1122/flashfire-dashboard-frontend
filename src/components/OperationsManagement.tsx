import { useState, useEffect, useContext } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Calendar, Lock, Save, X, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { UserContext } from '../state_management/UserContext.tsx';
import { toastUtils, toastMessages } from '../utils/toast.ts';
import { useOperationsStore } from '../state_management/Operations.ts';
import SecretKeyModal from './SecretKeyModal.tsx';

interface Todo {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
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
  const { role } = useOperationsStore();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [lockPeriods, setLockPeriods] = useState<LockPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [secretKeyError, setSecretKeyError] = useState('');
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
    }
  }, [userDetails?.email]);

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
        toastUtils.error('Failed to load operations data');
      }
    } catch (error) {
      console.error('Error fetching client operations:', error);
      toastUtils.error('Failed to load operations data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setShowSecretKeyModal(true);
  };

  const handleSecretKeyConfirm = async (secretKey: string) => {
    if (secretKey !== 'flashfire@2025') {
      setSecretKeyError('Incorrect secret key. Please try again.');
      return;
    }

    setShowSecretKeyModal(false);
    setSecretKeyError('');
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/operations/client-operations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientEmail: userDetails?.email,
          todos,
          lockPeriods
        }),
      });

      const result = await response.json();
      if (result.success) {
        toastUtils.success('Operations data saved successfully!');
      } else {
        toastUtils.error(result.message || 'Failed to save operations data');
      }
    } catch (error) {
      console.error('Error saving client operations:', error);
      toastUtils.error('Failed to save operations data');
    } finally {
      setSaving(false);
    }
  };

  const toggleTodo = (todoId: string) => {
    setTodos(todos.map(todo =>
      todo.id === todoId
        ? { ...todo, completed: !todo.completed, updatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) }
        : todo
    ));
  };

  const addTodo = () => {
    if (!newTodoTitle.trim()) return;

    const newTodo: Todo = {
      id: `todo-${Date.now()}`,
      title: newTodoTitle.trim(),
      notes: newTodoNotes.trim() || '',
      completed: false,
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
        <div className="mb-8">
          <h2 className="text-4xl md:text-4xl font-extrabold text-zinc-900 mb-2 tracking-tight leading-[1.1]">
            Operations Management
          </h2>
          <p className="text-gray-600 text-lg">Manage client TODOs and lock periods</p>
        </div>

        {/* Active Lock Period Alert */}
        {activeLockPeriod && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <Lock className="w-5 h-5 text-red-500 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">Lock Period Active</h3>
                <p className="text-sm text-red-700 mt-1">
                  Job cards cannot be moved from "Saved" to "Applied" until {new Date(activeLockPeriod.endDate).toLocaleDateString()}
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
                          {hasNotes && !isExpanded && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {todo.notes}
                            </p>
                          )}
                        </div>
                      </div>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                          aria-label="Delete TODO"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Secret Key Modal */}
      {showSecretKeyModal && (
        <SecretKeyModal
          isOpen={showSecretKeyModal}
          onClose={() => {
            setShowSecretKeyModal(false);
            setSecretKeyError('');
          }}
          onConfirm={handleSecretKeyConfirm}
          error={secretKeyError}
        />
      )}
    </div>
  );
};

export default OperationsManagement;

