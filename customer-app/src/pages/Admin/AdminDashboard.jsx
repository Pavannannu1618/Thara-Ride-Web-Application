import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { logout } from '../../app/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import {
  Users, Car, TrendingUp, Activity,
  LogOut, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="card">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${color}`}>
      <Icon size={18} className="text-white" />
    </div>
    <p className="text-2xl font-display font-bold text-white">{value}</p>
    <p className="text-white/40 text-xs mt-1">{label}</p>
    {sub && <p className="text-primary-400 text-xs mt-0.5">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [tab, setTab] = useState('overview');

  const { data: dash, isLoading, refetch } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn:  () => adminAPI.getDashboard(),
    refetchInterval: 30000,
  });

  const { data: pendingDrivers } = useQuery({
    queryKey: ['pendingDrivers'],
    queryFn:  () => adminAPI.getDrivers({ approvalStatus: 'pending' }),
  });

  const { data: usersData } = useQuery({
    queryKey: ['adminUsers'],
    queryFn:  () => adminAPI.getUsers({ page: 1, limit: 10 }),
    enabled:  tab === 'users',
  });

  const stats = dash?.data?.data || {};
  const drivers = pendingDrivers?.data?.data?.drivers || [];
  const users   = usersData?.data?.data?.users        || [];

  const handleApproveDriver = async (id, status) => {
    try {
      await adminAPI.approveDriver(id, status);
      refetch();
    } catch { }
  };

  const TABS = [
    { id: 'overview', label: 'Overview'  },
    { id: 'drivers',  label: 'Drivers'   },
    { id: 'users',    label: 'Users'     },
    { id: 'rides',    label: 'Live Rides'},
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="bg-dark-800/80 backdrop-blur-xl border-b border-white/[0.06] px-4 pt-10 pb-0 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-500/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
                <span className="text-violet-400 text-sm font-bold">A</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-white">Admin Dashboard</h1>
                <p className="text-white/30 text-xs">Thara Ride Control Center</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                <RefreshCw size={16} className="text-white/40" />
              </button>
              <button onClick={() => { dispatch(logout()); navigate('/'); }}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">
                <LogOut size={16} className="text-white/40" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all ${
                  tab === t.id
                    ? 'text-white bg-dark-900 border-t border-x border-white/[0.06]'
                    : 'text-white/30 hover:text-white/60'
                }`}>
                {t.label}
                {t.id === 'drivers' && drivers.length > 0 && (
                  <span className="ml-1.5 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {drivers.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Overview */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3 animate-fade-up">
              <StatCard icon={Users}     label="Total Users"    value={stats.totalUsers   || 0} color="bg-blue-500/80"   sub="All registered" />
              <StatCard icon={Car}       label="Active Drivers" value={stats.totalDrivers || 0} color="bg-emerald-500/80" sub="Approved"        />
              <StatCard icon={Activity}  label="Active Rides"   value={stats.activeRides  || 0} color="bg-primary-500/80" sub="Right now"       />
              <StatCard icon={TrendingUp}label="Today Revenue"  value={formatCurrency(stats.todayRevenue || 0)} color="bg-violet-500/80" sub="Platform cut" />
            </div>

            {/* Today's Stats */}
            <div className="card animate-fade-up delay-100">
              <h3 className="font-semibold mb-4 text-white/70 text-sm uppercase tracking-widest">Today</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total Rides',    value: stats.todayRides   || 0, bar: 60 },
                  { label: 'Completed',      value: stats.completedRides|| 0, bar: 45 },
                  { label: 'Cancelled',      value: stats.cancelledRides|| 0, bar: 15 },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-white/40 text-xs w-24 flex-shrink-0">{s.label}</span>
                    <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: s.bar + '%' }} />
                    </div>
                    <span className="text-white font-semibold text-sm w-8 text-right">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Drivers */}
        {tab === 'drivers' && (
          <div className="space-y-3 animate-fade-up">
            <p className="text-xs text-white/40 uppercase tracking-widest">
              Pending Approval ({drivers.length})
            </p>
            {drivers.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-white/50">No pending approvals</p>
              </div>
            ) : (
              drivers.map((driver) => (
                <div key={driver._id} className="card space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-lg">
                      {driver.user?.name?.[0] || 'D'}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{driver.user?.name}</p>
                      <p className="text-white/40 text-sm">{driver.user?.phone}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/20">
                      Pending
                    </span>
                  </div>
                  {driver.vehicle && (
                    <p className="text-sm text-white/50">
                      🚗 {driver.vehicle.make} {driver.vehicle.model} · {driver.vehicle.plateNumber}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveDriver(driver._id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                      <XCircle size={15} /> Reject
                    </button>
                    <button onClick={() => handleApproveDriver(driver._id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors">
                      <CheckCircle size={15} /> Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="space-y-3 animate-fade-up">
            <p className="text-xs text-white/40 uppercase tracking-widest">Recent Users</p>
            {users.map((user) => (
              <div key={user._id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                  {user.name?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-white/40 text-xs">{user.phone}</p>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full border ${user.isBlocked ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                  {user.isBlocked ? 'Blocked' : 'Active'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Rides */}
        {tab === 'rides' && (
          <LiveRidesTab />
        )}
      </div>
    </div>
  );
};

const LiveRidesTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['liveRides'],
    queryFn:  () => adminAPI.getLiveRides(),
    refetchInterval: 10000,
  });
  const rides = data?.data?.data?.rides || [];

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <p className="text-xs text-white/40 uppercase tracking-widest">Live Rides ({rides.length})</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-white/20 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : rides.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-3xl mb-2">🚗</p>
          <p className="text-white/50">No active rides right now</p>
        </div>
      ) : (
        rides.map((ride) => (
          <div key={ride._id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-primary-400">{ride.rideType}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                ride.status === 'started' ? 'bg-green-500/20 text-green-400' :
                ride.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>{ride.status}</span>
            </div>
            <p className="text-sm text-white/60 truncate">📍 {ride.pickup?.address}</p>
            <p className="text-sm text-white/60 truncate">🏁 {ride.destination?.address}</p>
            <div className="flex gap-4 text-xs text-white/30 pt-1 border-t border-white/[0.05]">
              <span>👤 {ride.customer?.name || 'Customer'}</span>
              {ride.driver && <span>🚗 {ride.driver?.user?.name || 'Driver'}</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminDashboard;