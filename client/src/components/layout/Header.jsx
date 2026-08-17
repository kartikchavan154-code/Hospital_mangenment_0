import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, Calendar, ChevronDown } from 'lucide-react';

const Header = () => {
  const { user } = useAuth();

  if (!user) return null;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="glass" style={{
      height: '70px',
      position: 'fixed',
      top: 0,
      right: 0,
      left: '260px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 30px',
      borderBottom: '1px solid #e2e8f0',
      zIndex: 99
    }}>
      {/* Date Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--muted))' }}>
        <Calendar size={16} />
        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{todayStr}</span>
      </div>

      {/* Action panel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Notification bell */}
        <button className="icon-btn" style={{ position: 'relative' }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            backgroundColor: 'hsl(var(--destructive))',
            borderRadius: '50%'
          }} />
        </button>

        {/* Vertical divider */}
        <div style={{ width: '1px', height: '24px', backgroundColor: '#cbd5e1' }} />

        {/* User preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', display: 'block' }}>
              {user.role === 'doctor' ? `Dr. ${user.lastName}` : `${user.firstName} ${user.lastName}`}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent))', textTransform: 'capitalize', fontWeight: 600 }}>
              {user.role}
            </span>
          </div>
          <ChevronDown size={14} style={{ color: 'hsl(var(--muted))' }} />
        </div>
      </div>
    </header>
  );
};

export default Header;
