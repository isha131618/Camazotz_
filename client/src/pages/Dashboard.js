import React, { useState, useEffect } from 'react';
import { Users, UserPlus, FileText, Activity, Calendar, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import API from '../utils/axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    patientsToday: 0,
    pendingDischarges: 0,
    todayAppointments: 0,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [patientsRes, appointmentsRes] = await Promise.all([
        API.get('/patients'),
        API.get('/appointments').catch(() => ({ data: [] }))
      ]);

      const patients = patientsRes.data || [];
      const appointments = appointmentsRes.data || [];

      const today = new Date().toISOString().split('T')[0];
      const patientsToday = patients.filter(p => 
        new Date(p.registrationDate).toISOString().split('T')[0] === today
      );
      
      const todayAppointments = appointments.filter(apt => 
        apt.date && apt.date.split('T')[0] === today
      );

      setStats({
        totalPatients: patients.length,
        patientsToday: patientsToday.length,
        pendingDischarges: patients.filter(p => p.status === 'Active').length,
        todayAppointments: todayAppointments.length,
        recentActivity: [
          ...patients.slice(0, 3).map(p => ({
            type: 'patient',
            message: `New patient: ${p.firstName} ${p.lastName}`,
            time: new Date(p.registrationDate).toLocaleDateString(),
            icon: UserPlus,
            color: 'text-blue-600'
          })),
          ...appointments.slice(0, 2).map(a => ({
            type: 'appointment',
            message: `Appointment scheduled`,
            time: a.date ? new Date(a.date).toLocaleDateString() : 'Today',
            icon: Calendar,
            color: 'text-green-600'
          }))
        ].slice(0, 4)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-green-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's an overview of your clinical practice.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="bg-blue-600"
          trend="+12% from last month"
          subtitle="Registered patients"
        />
        <StatCard
          title="Patients Today"
          value={stats.patientsToday}
          icon={UserPlus}
          color="bg-green-600"
          subtitle="New registrations"
        />
        <StatCard
          title="Pending Discharges"
          value={stats.pendingDischarges}
          icon={FileText}
          color="bg-orange-600"
          subtitle="Awaiting summary"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments}
          icon={Calendar}
          color="bg-purple-600"
          subtitle="Scheduled today"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/patients/register'}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <UserPlus className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Register New Patient</p>
              <p className="text-xs text-gray-500">Add a new patient record</p>
            </div>
          </button>
          <button
            onClick={() => window.location.href = '/patients'}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <Users className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">View Patients</p>
              <p className="text-xs text-gray-500">Browse patient records</p>
            </div>
          </button>
          <button
            onClick={() => window.location.href = '/medical-records'}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <FileText className="w-5 h-5 text-purple-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Medical Records</p>
              <p className="text-xs text-gray-500">Access patient histories</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">System Reminder</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Remember to complete discharge summaries for patients being discharged today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
