import React from 'react';
import Card from './Card';

const StatCard = ({ title, value, icon: Icon, description, trend, color = 'hsl(var(--primary))' }) => {
  return (
    <Card style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            {value}
          </span>
        </div>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          width: '46px',
          height: '46px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          boxShadow: `0 0 15px ${color}1A`
        }}>
          {Icon && <Icon size={22} />}
        </div>
      </div>
      {description && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>
          {trend && <span style={{ color: trend.startsWith('+') ? '#34d399' : '#f87171', fontWeight: 600 }}>{trend}</span>}
          <span>{description}</span>
        </div>
      )}
    </Card>
  );
};

export default StatCard;
