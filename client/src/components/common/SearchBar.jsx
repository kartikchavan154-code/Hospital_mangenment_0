import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          paddingLeft: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      />
      <Search size={18} style={{
        position: 'absolute',
        left: '14px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'hsl(var(--muted))'
      }} />
    </div>
  );
};

export default SearchBar;
