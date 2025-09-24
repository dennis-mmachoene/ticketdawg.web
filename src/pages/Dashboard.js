import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { 
  Ticket, 
  Scan, 
  Users, 
  Calendar, 
  Clock, 
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Send,
  AlertTriangle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import StatsCard from '../components/StatsCard';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await api.getTicketStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadStats();
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const quickActions = [
    {
      name: 'Issue Ticket',
      description: 'Assign tickets to student emails',
      href: '/issue-ticket',
      icon: Ticket,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
    },
    {
      name: 'Scan QR Code',
      description: 'Validate tickets at entrance',
      href: '/scan-ticket',
      icon: Scan,
      color: 'bg-primary-600',
      hoverColor: 'hover:bg-primary-700',
    },
    ...(isAdmin ? [{
      name: 'Manage Users',
      description: 'Create and manage ticket issuers',
      href: '/manage-users',
      icon: Users,
      color: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-700',
    }] : []),
  ];

  return (
    <div className="section-padding">
      <div className="container-custom space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">
              Welcome back, {user?.username}
            </h1>
            <p className="text-secondary-600 mt-1">
              {isAdmin ? 'Super Admin' : 'Ticket Issuer'} • Pool Party Ticketing System
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Global Statistics */}
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">Event Statistics</h2>
          <div className="grid-stats">
            <StatsCard
              title="Total Tickets"
              value={stats?.global?.total || 0}
              icon={TrendingUp}
              color="text-secondary-700"
              bgColor="bg-secondary-100"
              description="Available in system"
            />
            <StatsCard
              title="Tickets Sent"
              value={stats?.global?.sent || 0}
              icon={Send}
              color="text-blue-700"
              bgColor="bg-blue-100"
              description="Assigned to students"
            />
            <StatsCard
              title="Tickets Used"
              value={stats?.global?.used || 0}
              icon={CheckCircle}
              color="text-primary-700"
              bgColor="bg-primary-100"
              description="Validated at entrance"
            />
            <StatsCard
              title="Remaining"
              value={stats?.global?.remaining || 0}
              icon={AlertTriangle}
              color="text-orange-700"
              bgColor="bg-orange-100"
              description="Still available"
            />
          </div>
        </div>

        {/* Personal Statistics (for Issuers) */}
        {!isAdmin && stats?.personal && (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-6">Your Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatsCard
                title="Tickets Issued"
                value={stats.personal.ticketsIssued}
                icon={Ticket}
                color="text-purple-700"
                bgColor="bg-purple-100"
                description="Assigned by you"
              />
              <StatsCard
                title="Tickets Scanned"
                value={stats.personal.ticketsScanned}
                icon={Scan}
                color="text-green-700"
                bgColor="bg-green-100"
                description="Validated by you"
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="card hover:shadow-hard transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${action.color} ${action.hoverColor} p-3 rounded-lg transition-colors duration-200`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-700 transition-colors duration-200">
                        {action.name}
                      </h3>
                      <p className="text-secondary-600 text-sm mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Event Information */}
        <div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">Event Information</h2>
          <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h3 className="text-2xl font-bold mb-2">Action SA Students Chapter</h3>
                <p className="text-xl mb-4">Pool Party</p>
                <div className="flex flex-wrap items-center gap-4 text-primary-100">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>04 October 2025</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} />
                    <span>Starts at 12:00</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 lg:max-w-xs">
                <h4 className="font-semibold mb-3">Event Features:</h4>
                <ul className="space-y-1 text-sm text-primary-100">
                  <li>🍾 BOB (Bring your own bottles)</li>
                  <li>🍸 Free food & cocktails</li>
                  <li>🚌 Free transport available</li>
                  <li>🎵 DJ & Entertainment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action SA Branding */}
        <div className="text-center py-8 border-t border-secondary-200">
          <p className="text-lg font-semibold text-primary-700 mb-2">
            Action SA Students Chapter
          </p>
          <p className="text-secondary-600 mb-1">
            Thank you for making your voice heard
          </p>
          <p className="text-primary-600 font-medium">
            #The Future is not a mistake
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;