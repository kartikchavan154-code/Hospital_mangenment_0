import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main container */}
      <div style={{
        flex: 1,
        marginLeft: '260px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
        {/* Header */}
        <Header />

        {/* Page Content area */}
        <main className="animate-fade-in" style={{
          padding: '100px 30px 40px 30px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
