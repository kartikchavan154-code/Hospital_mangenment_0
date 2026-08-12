import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages } = pagination;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 0',
      color: 'hsl(var(--muted))',
      fontSize: '0.85rem'
    }}>
      <span>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={16} />
          Prev
        </button>
        
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
