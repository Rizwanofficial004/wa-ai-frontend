import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const BusinessDetail = () => {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    aiPersonality: '',
    welcomeMessage: ''
  });
  const [whatsappForm, setWhatsappForm] = useState({
    whatsappNumber: '',
    phoneNumberId: ''
  });

  useEffect(() => {
    fetchBusiness();
    fetchStats();
  }, [businessId]);

  const fetchBusiness = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}`);
      setBusiness(res.data.data);
      setEditForm({
        name: res.data.data.name || '',
        description: res.data.data.description || '',
        aiPersonality: res.data.data.aiPersonality || '',
        welcomeMessage: res.data.data.welcomeMessage || ''
      });
      setWhatsappForm({
        whatsappNumber: res.data.data.whatsappNumber || '',
        phoneNumberId: res.data.data.whatsappPhoneNumberId || ''
      });
    } catch (error) {
      toast.error('Failed to fetch business');
      navigate('/businesses');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}/stats`);
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/businesses/${businessId}`, editForm);
      toast.success('Business updated successfully!');
      setShowEditModal(false);
      fetchBusiness();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleConnectWhatsApp = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/businesses/${businessId}/whatsapp/connect`, whatsappForm);
      toast.success('WhatsApp connected successfully!');
      setShowWhatsAppModal(false);
      fetchBusiness();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to connect WhatsApp');
    }
  };

  const toggleAI = async () => {
    try {
      await api.put(`/businesses/${businessId}/ai/toggle`, {
        isEnabled: !business.isAIEnabled
      });
      toast.success(`AI ${business.isAIEnabled ? 'disabled' : 'enabled'} successfully!`);
      fetchBusiness();
    } catch (error) {
      toast.error('Failed to toggle AI');
    }
  };

  if (loading || !business) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <Link to="/businesses" style={styles.backLink}>← Back to Businesses</Link>
          <h1 style={styles.title}>{business.name}</h1>
          <p style={styles.subtitle}>{business.whatsappNumber}</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => setShowEditModal(true)} style={styles.editBtn}>
            Edit Business
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div style={styles.statusGrid}>
        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>WhatsApp Status</div>
          <div style={styles.statusValue}>
            <span style={{
              ...styles.statusDot,
              backgroundColor: business.isWhatsAppConnected ? '#10b981' : '#f59e0b'
            }} />
            {business.isWhatsAppConnected ? 'Connected' : 'Not Connected'}
          </div>
          <button onClick={() => setShowWhatsAppModal(true)} style={styles.connectBtn}>
            {business.isWhatsAppConnected ? 'Update WhatsApp Settings' : 'Connect WhatsApp'}
          </button>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>AI Chatbot</div>
          <div style={styles.statusValue}>
            <span style={{
              ...styles.statusDot,
              backgroundColor: business.isAIEnabled ? '#10b981' : '#6b7280'
            }} />
            {business.isAIEnabled ? 'Enabled' : 'Disabled'}
          </div>
          <button onClick={toggleAI} style={styles.toggleBtn}>
            {business.isAIEnabled ? 'Disable AI' : 'Enable AI'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={styles.statsSection}>
          <h2 style={styles.sectionTitle}>Overview</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{stats.totalConversations}</span>
              <span style={styles.statLabel}>Conversations</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{stats.activeConversations}</span>
              <span style={styles.statLabel}>Active</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{stats.totalMessages}</span>
              <span style={styles.statLabel}>Messages</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{stats.totalOrders}</span>
              <span style={styles.statLabel}>Orders</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{stats.totalLeads}</span>
              <span style={styles.statLabel}>Leads</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={styles.actionsSection}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionsGrid}>
          <Link to={`/businesses/${businessId}/conversations`} style={styles.actionCard}>
            <span style={styles.actionIcon}>💬</span>
            <span style={styles.actionTitle}>Conversations</span>
            <span style={styles.actionDesc}>View and manage chats</span>
          </Link>
          <Link to={`/businesses/${businessId}/products`} style={styles.actionCard}>
            <span style={styles.actionIcon}>👟</span>
            <span style={styles.actionTitle}>Products</span>
            <span style={styles.actionDesc}>Manage product catalog</span>
          </Link>
          <Link to={`/businesses/${businessId}/knowledge`} style={styles.actionCard}>
            <span style={styles.actionIcon}>📚</span>
            <span style={styles.actionTitle}>Knowledge Base</span>
            <span style={styles.actionDesc}>Manage AI training data</span>
          </Link>
          <Link to={`/businesses/${businessId}/orders`} style={styles.actionCard}>
            <span style={styles.actionIcon}>📦</span>
            <span style={styles.actionTitle}>Orders</span>
            <span style={styles.actionDesc}>View customer orders</span>
          </Link>
          <Link to={`/businesses/${businessId}/leads`} style={styles.actionCard}>
            <span style={styles.actionIcon}>👤</span>
            <span style={styles.actionTitle}>Leads</span>
            <span style={styles.actionDesc}>Manage customer leads</span>
          </Link>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Edit Business</h2>
            <form onSubmit={handleUpdate} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Business Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ ...styles.input, minHeight: '80px' }}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>AI Personality</label>
                <textarea
                  value={editForm.aiPersonality}
                  onChange={(e) => setEditForm({ ...editForm, aiPersonality: e.target.value })}
                  style={{ ...styles.input, minHeight: '80px' }}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Welcome Message</label>
                <textarea
                  value={editForm.welcomeMessage}
                  onChange={(e) => setEditForm({ ...editForm, welcomeMessage: e.target.value })}
                  style={{ ...styles.input, minHeight: '60px' }}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowEditModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Connect WhatsApp</h2>
            <form onSubmit={handleConnectWhatsApp} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>WhatsApp Business Number</label>
                <input
                  type="text"
                  value={whatsappForm.whatsappNumber}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappNumber: e.target.value })}
                  placeholder="+1234567890"
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number ID (from Meta)</label>
                <input
                  type="text"
                  value={whatsappForm.phoneNumberId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, phoneNumberId: e.target.value })}
                  placeholder="Enter Phone Number ID"
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowWhatsAppModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    alignItems: 'flex-start',
    marginBottom: '32px'
  },
  backLink: {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '14px',
    marginBottom: '8px',
    display: 'inline-block'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '4px'
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  editBtn: {
    padding: '10px 20px',
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  statusLabel: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '8px'
  },
  statusValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%'
  },
  connectBtn: {
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  toggleBtn: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  statsSection: {
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px'
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  statValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b'
  },
  actionsSection: {
    marginBottom: '32px'
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    textDecoration: 'none',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    transition: 'transform 0.2s'
  },
  actionIcon: {
    fontSize: '28px',
    marginBottom: '12px'
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px'
  },
  actionDesc: {
    fontSize: '13px',
    color: '#64748b'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '24px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '8px'
  },
  cancelBtn: {
    padding: '12px 20px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '12px 20px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};

export default BusinessDetail;