import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  User, 
  Mail, 
  Lock, 
  Calendar,
  Shield,
  UserCheck,
  AlertCircle,
  X
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  // Create user form state
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'issuer',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUsers();
  };

  const validateForm = () => {
    const { username, email, password } = newUser;

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

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
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'issuer',
      });
      
      loadUsers(); // Reload users list
    } catch (error) {
      let errorMessage = 'Failed to create user';
      
      if (error.message.includes('already exists')) {
        errorMessage = 'User with this username or email already exists';
      }
      
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.username}? This action cannot be undone.`)) {
      deleteUser(user.id);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.deleteUser(userId);
      loadUsers(); // Reload users list
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setNewUser({
      username: '',
      email: '',
      password: '',
      role: 'issuer',
    });
    setError('');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="section-padding">
      <div className="container-custom space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">User Management</h1>
            <p className="text-secondary-600 mt-1">
              Create and manage ticket issuers
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="card hover:shadow-medium transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary-900">{user.username}</h3>
                    <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-issuer'}`}>
                      {user.role === 'admin' ? 'ADMIN' : 'ISSUER'}
                    </span>
                  </div>
                </div>
                
                {user.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Delete user"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-2 text-sm text-secondary-600">
                <div className="flex items-center space-x-2">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={14} />
                  <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                {user.createdBy && (
                  <div className="flex items-center space-x-2">
                    <UserCheck size={14} />
                    <span>by {user.createdBy.username}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No users found</h3>
            <p className="text-secondary-600 mb-4">Get started by creating your first user</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add User</span>
            </button>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-hard max-w-md w-full max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateUser}>
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-secondary-200">
                  <h2 className="text-xl font-semibold text-secondary-900">Create New User</h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="p-2 hover:bg-secondary-100 rounded-lg transition-colors duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
                      <AlertCircle size={16} />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  {/* Username Field */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-secondary-400" />
                      </div>
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="input pl-10"
                        placeholder="Enter username"
                        disabled={isCreating}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-secondary-400" />
                      </div>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="input pl-10"
                        placeholder="user@example.com"
                        disabled={isCreating}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-secondary-400" />
                      </div>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="input pl-10"
                        placeholder="Minimum 6 characters"
                        disabled={isCreating}
                        autoComplete="new-password"
                      />
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-3">
                      Role *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`relative cursor-pointer ${isCreating ? 'cursor-not-allowed opacity-50' : ''}`}>
                        <input
                          type="radio"
                          name="role"
                          value="issuer"
                          checked={newUser.role === 'issuer'}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          disabled={isCreating}
                          className="sr-only"
                        />
                        <div className={`border rounded-lg p-4 text-center transition-all duration-200 ${
                          newUser.role === 'issuer' 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-secondary-200 hover:border-secondary-300'
                        }`}>
                          <UserCheck className={`h-6 w-6 mx-auto mb-2 ${
                            newUser.role === 'issuer' ? 'text-primary-600' : 'text-secondary-400'
                          }`} />
                          <div className={`font-medium ${
                            newUser.role === 'issuer' ? 'text-primary-900' : 'text-secondary-700'
                          }`}>
                            Ticket Issuer
                          </div>
                          <div className="text-xs text-secondary-500 mt-1">
                            Can issue & scan tickets
                          </div>
                        </div>
                      </label>

                      <label className={`relative cursor-pointer ${isCreating ? 'cursor-not-allowed opacity-50' : ''}`}>
                        <input
                          type="radio"
                          name="role"
                          value="admin"
                          checked={newUser.role === 'admin'}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          disabled={isCreating}
                          className="sr-only"
                        />
                        <div className={`border rounded-lg p-4 text-center transition-all duration-200 ${
                          newUser.role === 'admin' 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-secondary-200 hover:border-secondary-300'
                        }`}>
                          <Shield className={`h-6 w-6 mx-auto mb-2 ${
                            newUser.role === 'admin' ? 'text-red-600' : 'text-secondary-400'
                          }`} />
                          <div className={`font-medium ${
                            newUser.role === 'admin' ? 'text-red-900' : 'text-secondary-700'
                          }`}>
                            Admin
                          </div>
                          <div className="text-xs text-secondary-500 mt-1">
                            Full system access
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Role Description */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Role Permissions:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Ticket Issuers</strong> can issue tickets and scan QR codes</li>
                      <li>• <strong>Admins</strong> have full access to manage users and view all statistics</li>
                    </ul>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-secondary-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isCreating}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreating ? (
                      <>
                        <div className="loading-spinner" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Create User</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;