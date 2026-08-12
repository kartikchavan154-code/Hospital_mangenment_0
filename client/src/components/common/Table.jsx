import React from 'react';

const Table = ({ headers, children }) => {
  return (
    <div className="table-container glass" style={{ width: '100%' }}>
      <table>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
