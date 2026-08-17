import React from 'react';

const Card = ({ children, title, subtitle, style, ...props }) => {
  return (
    <div className="glass card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      ...style
    }} {...props}>
      {(title || subtitle) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          {title && <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>}
          {subtitle && <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted))' }}>{subtitle}</span>}
        </div>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
};

export default Card;
