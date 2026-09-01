import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { businessId } = useParams();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isBusinessActive = (path) => businessId && location.pathname.includes(path);

  // Role-based menu items
  const isAgent = user?.role === 'agent';
  const isOwner = user?.role === 'business_owner' || user?.role === 'admin';

  const mainNavItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard', ownerOnly: false },
    { path: '/businesses', icon: '🏢', label: 'Businesses', ownerOnly: true }
  ].filter(item => !item.ownerOnly || isOwner);

  const businessNavItems = businessId ? [
    { path: `/businesses/${businessId}/conversations`, icon: '💬', label: 'Inbox', badge: 'live', ownerOnly: false },
    { path: `/businesses/${businessId}/analytics`, icon: '📈', label: 'Analytics', ownerOnly: true },
    { path: `/businesses/${businessId}/agents`, icon: '👥', label: 'Team', ownerOnly: true },
    { path: `/businesses/${businessId}/automation`, icon: '⚡', label: 'Automation', ownerOnly: true },
    { path: `/businesses/${businessId}/broadcasts`, icon: '📢', label: 'Broadcasts', ownerOnly: true },
    { path: `/businesses/${businessId}/leads`, icon: '🎯', label: 'Leads', ownerOnly: false },
    { path: `/businesses/${businessId}/orders`, icon: '📦', label: 'Orders', ownerOnly: false },
    { path: `/businesses/${businessId}/products`, icon: '🛍️', label: 'Products', ownerOnly: false },
    { path: `/businesses/${businessId}/services`, icon: '💉', label: 'Services', ownerOnly: false },
    { path: `/businesses/${businessId}/knowledge`, icon: '📚', label: 'Knowledge', ownerOnly: false },
    { path: `/businesses/${businessId}/tags`, icon: '🏷️', label: 'Tags', ownerOnly: false },
    { path: `/businesses/${businessId}/settings`, icon: '⚙️', label: 'Settings', ownerOnly: true }
  ].filter(item => !item.ownerOnly || isOwner) : [];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: collapsed ? '70px' : '260px' }}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>W</div>
          {!collapsed && <span style={styles.logoText}>WhatsApp SaaS</span>}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            style={styles.collapseBtn}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav style={styles.nav}>
          {/* Main Navigation */}
          <div style={styles.navSection}>
            {!collapsed && <div style={styles.navSectionTitle}>Main</div>}
            {mainNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navLink,
                  ...(isActive(item.path) && styles.navLinkActive)
                }}
                title={item.label}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>

          {/* Business Navigation */}
          {businessId && (
            <div style={styles.navSection}>
              {!collapsed && <div style={styles.navSectionTitle}>Business</div>}
              {businessNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    ...styles.navLink,
                    ...(isBusinessActive(item.path.split('/').pop()) && styles.navLinkActive)
                  }}
                  title={item.label}
                >
                  <span style={styles.navIcon}>{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span>{item.label}</span>
                      {item.badge === 'live' && <span style={styles.liveBadge}>●</span>}
                    </>
                  )}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={{ ...styles.userInfo, flexDirection: collapsed ? 'column' : 'row' }}>
            <div style={{...styles.avatar, backgroundColor: isAgent ? '#10b981' : '#2563eb'}}>
              {user?.email?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div style={styles.userDetails}>
                <span style={styles.userName}>{user?.firstName || 'User'}</span>
                <span style={styles.userEmail}>{user?.email}</span>
                <span style={styles.roleBadge}>
                  {isAgent ? 'Agent' : 'Owner'}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout} 
            style={{ ...styles.logoutBtn, width: collapsed ? '40px' : '100%' }}
            title="Logout"
          >
            {collapsed ? '🚪' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9'
  },
  sidebar: {
    backgroundColor: '#0f172a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.2s',
    position: 'fixed',
    height: '100vh',
    zIndex: 100
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    borderBottom: '1px solid #1e293b'
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    backgroundColor: '#2563eb',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    flexShrink: 0
  },
  logoText: {
    fontSize: '16px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  collapseBtn: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '14px'
  },
  nav: {
    flex: 1,
    padding: '12px',
    overflowY: 'auto'
  },
  navSection: {
    marginBottom: '20px'
  },
  navSectionTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '8px 12px',
    marginBottom: '4px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    marginBottom: '2px'
  },
  navLinkActive: {
    backgroundColor: '#1e40af',
    color: '#fff'
  },
  navIcon: {
    fontSize: '18px',
    width: '20px',
    textAlign: 'center',
    flexShrink: 0
  },
  liveBadge: {
    marginLeft: 'auto',
    color: '#22c55e',
    fontSize: '10px',
    animation: 'pulse 2s infinite'
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid #1e293b'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  avatar: {
    width: '36px',
    height: '36px',
    backgroundColor: '#2563eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '14px',
    flexShrink: 0
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  userName: {
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  userEmail: {
    fontSize: '11px',
    color: '#64748b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  roleBadge: {
    fontSize: '10px',
    fontWeight: '500',
    marginTop: '4px',
    textAlign: 'left',
    color: '#64748b'
  },
  logoutBtn: {
    padding: '10px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  main: {
    flex: 1,
    marginLeft: '260px',
    padding: '24px',
    minHeight: '100vh',
    backgroundColor: '#f8fafc'
  }
};

export default Layout;
