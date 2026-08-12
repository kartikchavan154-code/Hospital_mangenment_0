import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  CalendarDays, 
  FileText, 
  CreditCard, 
  Activity, 
  History, 
  ShieldAlert, 
  LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  
  if (!user) return null;

  const role = user.role;

  const links = [
    // Shared / Role-specific home dashboards
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
    
    // Admin specific
    { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
    { to: '/analytics', label: 'Analytics', icon: Activity, roles: ['admin'] },
    { to: '/audit-logs', label: 'Audit Logs', icon: ShieldAlert, roles: ['admin'] },
    
    // Patient management (staff/docs)
    { to: '/patients', label: 'Patients', icon: UserSquare2, roles: ['admin', 'doctor', 'receptionist'] },
    
    // Doctor management (admin)
    { to: '/doctors', label: 'Doctors', icon: Users, roles: ['admin'] },
    
    // Appointments (everyone)
    { to: '/appointments', label: 'Appointments', icon: CalendarDays, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
    
    // Billing (admin, receptionist, patient)
    { to: '/billing', label: 'Billing & Invoices', icon: CreditCard, roles: ['admin', 'receptionist', 'patient'] },
    
    // Medical Records (doctor, patient)
    { to: '/medical-records', label: 'Medical Records', icon: FileText, roles: ['doctor', 'patient'] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(role));

  return (
    <aside className="glass" style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      zIndex: 100
    }}>
      {/* Brand Logo */}
      <div style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: '#fff',
          fontSize: '1.2rem',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
        }}>
          H
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px', color: '#fff' }}>HOSPITAL</span>
          <span style={{ color: 'hsl(var(--accent))', fontWeight: 600, fontSize: '0.8rem', display: 'block', marginTop: '-3px' }}>MANAGEMENT</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {filteredLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: isActive ? '#fff' : 'hsl(var(--muted))',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid hsl(var(--primary))' : '3px solid transparent',
                transition: 'all 0.2s ease',
                fontWeight: isActive ? 600 : 400
              })}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Profile Area */}
      <div style={{
        padding: '20px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backgroundImage: `url(${user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName}`})`,
            backgroundSize: 'cover'
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.firstName} {user.lastName}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent))', textTransform: 'uppercase', fontWeight: 700 }}>
              {user.role}
            </span>
          </div>
        </div>
        
        <button 
          onClick={logout}
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
