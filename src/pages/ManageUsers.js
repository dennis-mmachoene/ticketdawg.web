import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Plus, Trash2, RefreshCw, User, Mail, Lock, Calendar, Ticket, Scan, AlertCircle, X, LogOut, Pencil } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const emptyUser = { username: '', email: '', password: '', permissions: [] };

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState(emptyUser);

  // Edit-roles modal state
  const [editUser, setEditUser] = useState(null);
  const [editPerms, setEditPerms] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.getUsers();
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => { setIsRefreshing(true); loadUsers(); };

  const togglePerm = (perm) => {
    setNewUser((u) => ({
      ...u,
      permissions: u.permissions.includes(perm) ? u.permissions.filter((p) => p !== perm) : [...u.permissions, perm],
    }));
  };

  const validateForm = () => {
    const { username, email, password, permissions } = newUser;
    if (!username.trim() || !email.trim() || !password.trim()) { setError('All fields are required'); return false; }
    if (password.length < 6) { setError('Password must be at least 6 characters long'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return false; }
    if (permissions.length === 0) { setError('Select at least one role: Ticketer and/or Scanner'); return false; }
    return true;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setIsCreating(true);
    try {
      await api.createUser(newUser);
      setShowCreateModal(false);
      setNewUser(emptyUser);
      loadUsers();
    } catch (err) {
      setError(err.message && err.message.includes('already exists') ? 'User with this username or email already exists' : (err.message || 'Failed to create user'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = (u) => {
    if (window.confirm(`Remove ${u.username}? They will no longer be able to log in.`)) deleteUser(u.id);
  };

  const deleteUser = async (userId) => {
    try { await api.deleteUser(userId); loadUsers(); } catch (err) { setError('Failed to remove user'); }
  };

  const handleForceLogout = async (u) => {
    try { await api.forceLogout(u.id); loadUsers(); } catch (err) { setError('Failed to force logout'); }
  };

  const closeModal = () => { setShowCreateModal(false); setNewUser(emptyUser); setError(''); };

  const openEdit = (u) => { setEditUser(u); setEditPerms(u.permissions || []); setError(''); };
  const closeEdit = () => { setEditUser(null); setEditPerms([]); setError(''); };
  const toggleEditPerm = (perm) => {
    setEditPerms((cur) => (cur.includes(perm) ? cur.filter((p) => p !== perm) : [...cur, perm]));
  };
  const saveEdit = async () => {
    if (editPerms.length === 0) { setError('Select at least one role'); return; }
    setIsSaving(true);
    try {
      await api.updateUserPermissions(editUser.id, editPerms);
      closeEdit();
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update roles');
    } finally {
      setIsSaving(false);
    }
  };

  const permBadges = (u) => {
    if (u.role === 'admin') return ['Super Admin'];
    return (u.permissions || []).map((p) => (p === 'issue' ? 'Ticketer' : 'Scanner'));
  };

  const PermPicker = ({ selected, onToggle }) => (
    <div className="grid grid-cols-2 gap-3">
      <label className="relative cursor-pointer">
        <input type="checkbox" checked={selected.includes('issue')} onChange={() => onToggle('issue')} className="sr-only" />
        <div className={`border rounded-lg p-4 text-center transition-all duration-200 ${selected.includes('issue') ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 hover:border-secondary-300'}`}>
          <Ticket className={`h-6 w-6 mx-auto mb-2 ${selected.includes('issue') ? 'text-primary-600' : 'text-secondary-400'}`} />
          <div className={`font-medium ${selected.includes('issue') ? 'text-primary-900' : 'text-secondary-700'}`}>Ticketer</div>
          <div className="text-xs text-secondary-500 mt-1">Can issue tickets</div>
        </div>
      </label>
      <label className="relative cursor-pointer">
        <input type="checkbox" checked={selected.includes('scan')} onChange={() => onToggle('scan')} className="sr-only" />
        <div className={`border rounded-lg p-4 text-center transition-all duration-200 ${selected.includes('scan') ? 'border-primary-500 bg-primary-50' : 'border-secondary-200 hover:border-secondary-300'}`}>
          <Scan className={`h-6 w-6 mx-auto mb-2 ${selected.includes('scan') ? 'text-primary-600' : 'text-secondary-400'}`} />
          <div className={`font-medium ${selected.includes('scan') ? 'text-primary-900' : 'text-secondary-700'}`}>Scanner</div>
          <div className="text-xs text-secondary-500 mt-1">Can scan tickets</div>
        </div>
      </label>
    </div>
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="section-padding">
      <div className="container-custom space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">User Management</h1>
            <p className="text-secondary-600 mt-1">Create and manage ticketers and scanners</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={handleRefresh} disabled={isRefreshing} className="btn-secondary flex items-center space-x-2 disabled:opacity-50">
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /><span>Refresh</span>
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center space-x-2">
              <Plus size={16} /><span>Add User</span>
            </button>
          </div>
        </div>

        {error && !showCreateModal && !editUser && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
            <AlertCircle size={16} /><span className="text-sm">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u) => (
            <div key={u.id} className="card hover:shadow-medium transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-lg">{u.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{u.username}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {permBadges(u).map((label) => (
                        <span key={label} className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-issuer'}`}>{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {u.id !== currentUser?.id && u.role !== 'admin' && (
                  <button onClick={() => handleDeleteUser(u)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200" title="Remove user">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm text-secondary-600">
                <div className="flex items-center space-x-2"><Mail size={14} /><span>{u.email}</span></div>
                <div className="flex items-center space-x-2"><Calendar size={14} /><span>Created: {new Date(u.createdAt).toLocaleDateString()}</span></div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${u.online ? 'bg-green-500' : 'bg-secondary-300'}`}></span>
                  <span>{u.online ? 'Online now' : 'Offline'}</span>
                </div>
              </div>

              {u.role !== 'admin' && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(u)} className="flex-1 btn-secondary text-sm flex items-center justify-center space-x-2">
                    <Pencil size={14} /><span>Edit roles</span>
                  </button>
                  {u.online && u.id !== currentUser?.id && (
                    <button onClick={() => handleForceLogout(u)} className="flex-1 btn-secondary text-sm flex items-center justify-center space-x-2">
                      <LogOut size={14} /><span>Force logout</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No users found</h3>
            <p className="text-secondary-600 mb-4">Add your first ticketer or scanner</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary inline-flex items-center space-x-2">
              <Plus size={16} /><span>Add User</span>
            </button>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-hard max-w-md w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateUser}>
                <div className="flex items-center justify-between p-6 border-b border-secondary-200">
                  <h2 className="text-xl font-semibold text-secondary-900">Add User</h2>
                  <button type="button" onClick={closeModal} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors duration-200"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
                      <AlertCircle size={16} /><span className="text-sm">{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Username *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-secondary-400" /></div>
                      <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="input pl-10" placeholder="Enter username" disabled={isCreating} autoComplete="off" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Email *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-secondary-400" /></div>
                      <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="input pl-10" placeholder="user@example.com" disabled={isCreating} autoComplete="off" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">Password *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-secondary-400" /></div>
                      <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="input pl-10" placeholder="Minimum 6 characters" disabled={isCreating} autoComplete="new-password" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-3">Roles * (pick one or both)</label>
                    <PermPicker selected={newUser.permissions} onToggle={togglePerm} />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">A person can be a Ticketer, a Scanner, or both. You can change their roles later with Edit roles.</p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 p-6 border-t border-secondary-200">
                  <button type="button" onClick={closeModal} disabled={isCreating} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                  <button type="submit" disabled={isCreating} className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isCreating ? (<><div className="loading-spinner" /><span>Creating...</span></>) : (<><Plus size={16} /><span>Create User</span></>)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-hard max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-secondary-200">
                <h2 className="text-xl font-semibold text-secondary-900">Edit roles: {editUser.username}</h2>
                <button onClick={closeEdit} className="p-2 hover:bg-secondary-100 rounded-lg transition-colors duration-200"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
                    <AlertCircle size={16} /><span className="text-sm">{error}</span>
                  </div>
                )}
                <PermPicker selected={editPerms} onToggle={toggleEditPerm} />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">Tip: during voting keep them as Ticketer. On the pool party day, tick Scanner too and save.</p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-secondary-200">
                <button onClick={closeEdit} disabled={isSaving} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                <button onClick={saveEdit} disabled={isSaving} className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving ? (<><div className="loading-spinner" /><span>Saving...</span></>) : (<span>Save roles</span>)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
