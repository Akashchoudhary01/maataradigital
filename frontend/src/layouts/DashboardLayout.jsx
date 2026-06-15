import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Users, CreditCard, Receipt, BarChart3,
  Settings, LogOut, Bell, Menu, X, ChevronDown, TrendingUp,
} from 'lucide-react';
import { logout } from '../redux/slices/authSlice';
import api from '../services/api';
import maatara from '../Assets/maatara.jpg'


const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/borrowers', label: 'Borrowers', icon: Users },
  { path: '/loans', label: 'Loans', icon: CreditCard },
  { path: '/repayments', label: 'Repayments', icon: Receipt },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/dashboard/notifications?limit=10');
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch {}
  };

  const handleMarkRead = async () => {
    try {
      await api.put('/dashboard/notifications/mark-read');
      setUnreadCount(0);
      setNotifications((n) => n.map((notif) => ({ ...notif, isRead: true })));
    } catch {}
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
       <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
  <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center overflow-hidden">
    <img
      src={maatara}
      className="w-full h-full object-cover"
      alt="logo"
    />
  </div>

          <div>
            <p className="font-bold text-white text-lg leading-none">Loan</p>
            <p className="text-gray-400 text-xs">Management System</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(path)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu size={22} />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h1 className="font-semibold text-gray-800 text-sm capitalize">
              {navItems.find((n) => isActive(n.path))?.label || 'Dashboard'}
            </h1>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unreadCount > 0) handleMarkRead(); }}
              className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <p className="font-semibold text-gray-800 text-sm">Notifications</p>
                  <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} className={`px-4 py-3 ${n.isRead ? '' : 'bg-primary-50'}`}>
                        <p className="text-sm font-medium text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
