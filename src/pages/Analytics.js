import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { analyticsApi } from '../services/api';

const AnalyticsDashboard = () => {
  const { businessId } = useParams();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [businessId, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getDashboard(businessId, { period });
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const formatCurrency = (num) => {
    return 'PKR ' + (num || 0).toLocaleString();
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics Dashboard</h1>
          <p style={styles.subtitle}>Track your business performance</p>
        </div>
        <div style={styles.periodSelector}>
          {['24h', '7d', '30d', '90d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                ...styles.periodBtn,
                ...(period === p ? styles.periodBtnActive : {})
              }}
            >
              {p === '24h' ? '24 Hours' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Live Stats */}
      <div style={styles.liveSection}>
        <h3 style={styles.sectionTitle}>🔴 Live Now</h3>
        <div style={styles.liveGrid}>
          <div style={styles.liveCard}>
            <span style={styles.liveValue}>{analytics?.live?.activeConversations || 0}</span>
            <span style={styles.liveLabel}>Active Chats</span>
          </div>
          <div style={styles.liveCard}>
            <span style={styles.liveValue}>{analytics?.live?.onlineAgents || 0}</span>
            <span style={styles.liveLabel}>Agents Online</span>
          </div>
          <div style={styles.liveCard}>
            <span style={styles.liveValue}>{analytics?.live?.pendingHandoffs || 0}</span>
            <span style={styles.liveLabel}>Pending Handoffs</span>
          </div>
          <div style={styles.liveCard}>
            <span style={styles.liveValue}>{analytics?.live?.unreadMessages || 0}</span>
            <span style={styles.liveLabel}>Unread Messages</span>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📈 Overview</h3>
        <div style={styles.statsGrid}>
          <StatCard
            title="Conversations"
            value={formatNumber(analytics?.totals?.conversations)}
            icon="💬"
            trend={analytics?.trends?.conversations}
          />
          <StatCard
            title="Messages"
            value={formatNumber(analytics?.totals?.messages)}
            icon="📨"
            trend={analytics?.trends?.messages}
          />
          <StatCard
            title="Leads"
            value={formatNumber(analytics?.totals?.leads)}
            icon="🎯"
            trend={analytics?.trends?.leads}
          />
          <StatCard
            title="Orders"
            value={formatNumber(analytics?.totals?.orders)}
            icon="📦"
            trend={analytics?.trends?.orders}
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(analytics?.totals?.revenue)}
            icon="💰"
            trend={analytics?.trends?.revenue}
          />
          <StatCard
            title="Bot Handled"
            value={formatNumber(analytics?.totals?.botHandled)}
            icon="🤖"
            subtext={`${Math.round((analytics?.totals?.botHandled / (analytics?.totals?.conversations || 1)) * 100)}%`}
          />
        </div>
      </div>

      {/* Top Tags */}
      {analytics?.topTags?.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🏷️ Top Tags</h3>
          <div style={styles.tagsContainer}>
            {analytics.topTags.map((tag, index) => (
              <div key={index} style={styles.tagItem}>
                <span style={styles.tagName}>{tag.name}</span>
                <span style={styles.tagCount}>{tag.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Performance */}
      {analytics?.agentPerformance?.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>👥 Agent Performance</h3>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Agent</th>
                  <th style={styles.th}>Chats Handled</th>
                  <th style={styles.th}>Messages Sent</th>
                  <th style={styles.th}>Avg Response</th>
                  <th style={styles.th}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {analytics.agentPerformance.map((agent, index) => (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>{agent.name}</td>
                    <td style={styles.td}>{agent.stats?.totalChatsHandled || 0}</td>
                    <td style={styles.td}>{agent.stats?.totalMessagesSent || 0}</td>
                    <td style={styles.td}>{agent.stats?.averageResponseTime || 0}s</td>
                    <td style={styles.td}>
                      ⭐ {agent.stats?.satisfactionRating?.toFixed(1) || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, trend, subtext }) => (
  <div style={styles.statCard}>
    <div style={styles.statHeader}>
      <span style={styles.statIcon}>{icon}</span>
      <span style={styles.statTitle}>{title}</span>
    </div>
    <div style={styles.statValue}>{value}</div>
    {trend !== undefined && (
      <div style={{
        ...styles.statTrend,
        color: trend >= 0 ? '#10b981' : '#ef4444'
      }}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    )}
    {subtext && <div style={styles.statSubtext}>{subtext}</div>}
  </div>
);

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    color: '#64748b'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  periodSelector: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#e2e8f0',
    padding: '4px',
    borderRadius: '10px'
  },
  periodBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  periodBtnActive: {
    backgroundColor: '#fff',
    color: '#0f172a',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  liveSection: {
    marginBottom: '24px'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '16px'
  },
  liveGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px'
  },
  liveCard: {
    backgroundColor: '#1e40af',
    color: '#fff',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  liveValue: {
    fontSize: '32px',
    fontWeight: '700'
  },
  liveLabel: {
    fontSize: '13px',
    opacity: 0.9,
    marginTop: '4px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  statHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  statIcon: {
    fontSize: '20px'
  },
  statTitle: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a'
  },
  statTrend: {
    fontSize: '13px',
    fontWeight: '500',
    marginTop: '4px'
  },
  statSubtext: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px'
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px'
  },
  tagItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fff',
    padding: '8px 16px',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tagName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#0f172a'
  },
  tagCount: {
    fontSize: '12px',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    backgroundColor: '#f8fafc',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e2e8f0'
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#0f172a',
    borderBottom: '1px solid #f1f5f9'
  },
  tr: {
    transition: 'background-color 0.2s'
  }
};

export default AnalyticsDashboard;
