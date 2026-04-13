import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalConversations: 0,
    totalMessages: 0,
    totalOrders: 0,
    totalLeads: 0
  });
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/businesses');
      setBusinesses(res.data.data);

      // Calculate total stats from all businesses
      let totalStats = {
        totalBusinesses: res.data.count,
        totalConversations: 0,
        totalMessages: 0,
        totalOrders: 0,
        totalLeads: 0
      };

      // Fetch stats for each business
      for (const business of res.data.data) {
        try {
          const statsRes = await api.get(`/businesses/${business._id}/stats`);
          totalStats.totalConversations += statsRes.data.data.totalConversations;
          totalStats.totalMessages += statsRes.data.data.totalMessages;
          totalStats.totalOrders += statsRes.data.data.totalOrders;
          totalStats.totalLeads += statsRes.data.data.totalLeads;
        } catch (e) {
          console.error('Error fetching business stats:', e);
        }
      }

      setStats(totalStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Businesses', value: stats.totalBusinesses, color: '#2563eb', icon: '🏢' },
    { title: 'Conversations', value: stats.totalConversations, color: '#10b981', icon: '💬' },
    { title: 'Messages', value: stats.totalMessages, color: '#8b5cf6', icon: '✉️' },
    { title: 'Orders', value: stats.totalOrders, color: '#f59e0b', icon: '📦' },
    { title: 'Leads', value: stats.totalLeads, color: '#ef4444', icon: '👤' }
  ];

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <Link to="/businesses" style={styles.addButton}>
          + Add Business
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <div key={index} style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: `${stat.color}15` }}>
              {stat.icon}
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stat.value}</span>
              <span style={styles.statTitle}>{stat.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Businesses List */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Your Businesses</h2>
        {businesses.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No businesses yet</p>
            <Link to="/businesses" style={styles.emptyLink}>
              Create your first business
            </Link>
          </div>
        ) : (
          <div style={styles.businessGrid}>
            {businesses.map((business) => (
              <Link
                key={business._id}
                to={`/businesses/${business._id}`}
                style={styles.businessCard}
              >
                <div style={styles.businessHeader}>
                  <h3 style={styles.businessName}>{business.name}</h3>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: business.isWhatsAppConnected ? '#10b981' : '#f59e0b'
                  }}>
                    {business.isWhatsAppConnected ? 'Connected' : 'Setup Required'}
                  </span>
                </div>
                <p style={styles.businessPhone}>{business.whatsappNumber}</p>
                <div style={styles.businessFooter}>
                  <span style={{
                    ...styles.aiBadge,
                    backgroundColor: business.isAIEnabled ? '#10b981' : '#6b7280'
                  }}>
                    AI {business.isAIEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    color: '#64748b'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b'
  },
  addButton: {
    padding: '12px 20px',
    backgroundColor: '#2563eb',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  statIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px'
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b'
  },
  statTitle: {
    fontSize: '13px',
    color: '#64748b'
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '20px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  emptyText: {
    color: '#64748b',
    marginBottom: '12px'
  },
  emptyLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '500'
  },
  businessGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px'
  },
  businessCard: {
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  businessHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  businessName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#fff'
  },
  businessPhone: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '16px'
  },
  businessFooter: {
    display: 'flex',
    gap: '8px'
  },
  aiBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#fff'
  }
};

export default Dashboard;