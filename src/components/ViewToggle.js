import React from 'react';

const ViewToggle = ({ view, onViewChange }) => {
  return (
    <div style={styles.container}>
      <button
        onClick={() => onViewChange('list')}
        style={{
          ...styles.btn,
          ...(view === 'list' ? styles.activeBtn : {})
        }}
        title="List View"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>
      <button
        onClick={() => onViewChange('card')}
        style={{
          ...styles.btn,
          ...(view === 'card' ? styles.activeBtn : {})
        }}
        title="Card View"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f1f5f9',
    padding: '4px',
    borderRadius: '8px'
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activeBtn: {
    backgroundColor: '#fff',
    color: '#2563eb',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  }
};

export default ViewToggle;
