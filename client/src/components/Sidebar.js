import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  UserPlus, 
  Users, 
  FileText, 
  Settings, 
  Calendar,
  Activity
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'register-patient',
      label: 'Register Patient',
      icon: UserPlus,
      path: '/patients/register'
    },
    {
      id: 'patients',
      label: 'Registered Patients',
      icon: Users,
      path: '/patients'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: Calendar,
      path: '/appointments'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      path: '/reports'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-40">
      <nav className="h-full py-6">
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Menu</h2>
        </div>
        
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isActive(item.path) ? 'text-blue-600' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Quick Actions */}
        <div className="px-4 mt-8 mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Actions</h2>
        </div>
        
        <ul className="space-y-1 px-3">
          <li>
            <button
              onClick={() => navigate('/patients/register')}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
            >
              <UserPlus className="w-5 h-5" />
              <span className="text-sm font-medium">Quick Register</span>
            </button>
          </li>
        </ul>

        {/* System Status */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            MediCare Pro v2.0
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
