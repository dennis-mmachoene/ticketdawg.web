import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const ActivityMonitor = () => {
  const [logs, setLogs] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: '',
    page: 1,
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [logsResponse, statsResponse] = await Promise.all([
        api.getActivityLogs(filters),
        api.getSystemStats(),
      ]);
      
      setLogs(logsResponse.data.logs);
      setSystemStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading activity data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async (userId) => {
    try {
      const response = await api.getUserStats(userId);
      setUserStats(response.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const getActionColor = (action) => {
    const colors = {
      ticket_issued: 'text-blue-700 bg-blue-100',
      ticket_validated: 'text-green-700 bg-green-100',
      user_created: 'text-purple-700 bg-purple-100',
      user_deleted: 'text-red-700 bg-red-100',
      login: 'text-gray-700 bg-gray-100',
      logout: 'text-gray-700 bg-gray-100',
    };
    return colors[action] || 'text-gray-700 bg-gray-100';
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'success':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'failure':
        return <XCircle size={16} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-600" />;
      default:
        return null;
    }
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
            <h1 className="text-3xl font-bold text-secondary-900">Activity Monitor</h1>
            <p className="text-secondary-600 mt-1">
              Track and monitor all system activities
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadData}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => {/* Export functionality */}}
              className="btn-primary flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* System Overview */}
        {systemStats && (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center space-x-3 mb-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-medium text-secondary-600">Tickets Issued</h3>
                </div>
                <p className="text-3xl font-bold text-secondary-900">
                  {systemStats.actionBreakdown.ticket_issued || 0}
                </p>
              </div>

              <div className="card">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="text-sm font-medium text-secondary-600">Tickets Validated</h3>
                </div>
                <p className="text-3xl font-bold text-secondary-900">
                  {systemStats.actionBreakdown.ticket_validated || 0}
                </p>
              </div>

              <div className="card">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <h3 className="text-sm font-medium text-secondary-600">Active Users</h3>
                </div>
                <p className="text-3xl font-bold text-secondary-900">
                  {systemStats.topUsers.length}
                </p>
              </div>

              <div className="card">
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <h3 className="text-sm font-medium text-secondary-600">Total Actions</h3>
                </div>
                <p className="text-3xl font-bold text-secondary-900">
                  {Object.values(systemStats.actionBreakdown).reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top Users */}
        {systemStats && systemStats.topUsers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">Most Active Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemStats.topUsers.map((user) => (
                <div key={user._id} className="card hover:shadow-medium transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900">{user.username}</p>
                        <p className="text-xs text-secondary-500">{user.role.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">{user.count}</p>
                      <p className="text-xs text-secondary-500">actions</p>
                    </div>
                  </div>
                  <button
                    onClick={() => loadUserStats(user._id)}
                    className="mt-4 w-full btn-secondary text-sm flex items-center justify-center space-x-2"
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center space-x-2">
            <Filter size={18} />
            <span>Filter Activity Logs</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
              className="input"
            >
              <option value="">All Actions</option>
              <option value="ticket_issued">Ticket Issued</option>
              <option value="ticket_validated">Ticket Validated</option>
              <option value="user_created">User Created</option>
              <option value="user_deleted">User Deleted</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="input"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="input"
              placeholder="End Date"
            />

            <button
              onClick={() => setFilters({ action: '', startDate: '', endDate: '', page: 1 })}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="card overflow-hidden">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Activity Logs</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">
                        {log.user?.username}
                      </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">
                        {log.user?.username}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {log.user?.role.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary-600">
                      {log.details.ticketID && (
                        <div className="mb-1">
                          <span className="font-medium">Ticket:</span> {log.details.ticketID}
                        </div>
                      )}
                      {log.details.ticketEmail && (
                        <div>
                          <span className="font-medium">Email:</span> {log.details.ticketEmail}
                        </div>
                      )}
                      {log.details.targetUser && (
                        <div>
                          <span className="font-medium">Target:</span> {log.details.targetUser}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getResultIcon(log.result)}
                        <span className="text-sm text-secondary-600 capitalize">
                          {log.result}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {logs.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">No activity logs found</p>
            </div>
          )}
        </div>

        {/* User Stats Modal */}
        {userStats && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-hard max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-secondary-900">
                  User Statistics: {userStats.user.username}
                </h3>
                <button
                  onClick={() => setUserStats(null)}
                  className="p-2 hover:bg-secondary-100 rounded-lg"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {userStats.summary.totalActions}
                    </p>
                    <p className="text-sm text-secondary-600">Total Actions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {userStats.summary.successCount}
                    </p>
                    <p className="text-sm text-secondary-600">Successful</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {userStats.summary.failureCount}
                    </p>
                    <p className="text-sm text-secondary-600">Failed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {userStats.summary.successRate}%
                    </p>
                    <p className="text-sm text-secondary-600">Success Rate</p>
                  </div>
                </div>

                {/* Action Breakdown */}
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-4">Action Breakdown</h4>
                  <div className="space-y-2">
                    {Object.entries(userStats.statistics).map(([action, count]) => (
                      <div key={action} className="flex items-center justify-between py-2 border-b border-secondary-100">
                        <span className="text-sm text-secondary-700 capitalize">
                          {action.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-medium text-secondary-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="font-semibold text-secondary-900 mb-4">Recent Activity</h4>
                  <div className="space-y-2">
                    {userStats.recentActivity.map((activity) => (
                      <div key={activity._id} className="flex items-start justify-between py-2 border-b border-secondary-100">
                        <div className="flex-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(activity.action)}`}>
                            {activity.action.replace('_', ' ').toUpperCase()}
                          </span>
                          {activity.details.ticketID && (
                            <p className="text-xs text-secondary-600 mt-1">
                              Ticket: {activity.details.ticketID}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-secondary-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityMonitor;