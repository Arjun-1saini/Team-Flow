import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, FolderKanban, CheckSquare, User,
  LogOut, Zap, Shield, UserCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={17} color="white" strokeWidth={2.5} />
        </div>
        <span className="sidebar-logo-text">TeamFlow</span>
      </div>

      {/* Role Banner */}
      <div style={{
        margin: '10px 12px 0',
        padding: '8px 12px',
        borderRadius: 10,
        background: isAdmin
          ? 'linear-gradient(135deg, rgba(10,132,255,0.12), rgba(191,90,242,0.12))'
          : 'var(--bg-3)',
        border: `1px solid ${isAdmin ? 'rgba(10,132,255,0.2)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {isAdmin
          ? <Shield size={14} color="var(--accent)" />
          : <UserCircle size={14} color="var(--text-3)" />}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: isAdmin ? 'var(--accent)' : 'var(--text-2)' }}>
            {isAdmin ? 'Administrator' : 'Team Member'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
            {isAdmin ? 'Full access' : 'View & task access'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={16} />{label}
          </NavLink>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 12 }}>Account</div>
        <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <User size={16} />Profile
        </NavLink>
        <button className="sidebar-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          <LogOut size={16} />Log out
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
{/* User info */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role" style={{ color: isAdmin ? 'var(--accent)' : 'var(--text-3)', fontSize: 11 }}>
              {isAdmin ? '⚡ Admin' : '👤 Member'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
