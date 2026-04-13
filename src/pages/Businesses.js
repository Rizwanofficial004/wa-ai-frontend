import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const Businesses = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    whatsappNumber: '',
    description: '',
    category: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const res = await api.get('/businesses');
      setBusinesses(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/businesses', formData);
      toast.success('Business created successfully!');
      setShowModal(false);
      setFormData({ name: '', whatsappNumber: '', description: '', category: '' });
      fetchBusinesses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create business');
    }
  };

  const handleDelete = async (businessId) => {
    if (!window.confirm('Are you sure you want to delete this business?')) return;
    try {
      await api.delete(`/businesses/${businessId}`);
      toast.success('Business deleted successfully!');
      fetchBusinesses();
    } catch (error) {
      toast.error('Failed to delete business');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading businesses...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Businesses</h1>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          + Add Business
        </button>
      </div>

      {businesses.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🏢</div>
          <h3 style={styles.emptyTitle}>No businesses yet</h3>
          <p style={styles.emptyText}>Create your first business to get started</p>
          <button onClick={() => setShowModal(true)} style={styles.emptyButton}>
            Create Business
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {businesses.map((business) => (
            <div key={business._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{business.name}</h3>
                <div style={styles.cardActions}>
                  <button
                    onClick={() => handleDelete(business._id)}
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p style={styles.cardPhone}>{business.whatsappNumber}</p>
              {business.description && (
                <p style={styles.cardDesc}>{business.description}</p>
              )}
              <div style={styles.cardBadges}>
                <span style={{
                  ...styles.badge,
                  backgroundColor: business.isWhatsAppConnected ? '#10b981' : '#f59e0b'
                }}>
                  {business.isWhatsAppConnected ? 'WhatsApp Connected' : 'Setup Required'}
                </span>
                <span style={{
                  ...styles.badge,
                  backgroundColor: business.isAIEnabled ? '#10b981' : '#6b7280'
                }}>
                  AI {business.isAIEnabled ? 'On' : 'Off'}
                </span>
              </div>
              <div style={styles.cardLinks}>
                <Link to={`/businesses/${business._id}`} style={styles.viewLink}>
                  View Details →
                </Link>
                <Link to={`/businesses/${business._id}/conversations`} style={styles.link}>
                  Conversations
                </Link>
                <Link to={`/businesses/${business._id}/knowledge`} style={styles.link}>
                  Knowledge
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Business Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Create Business</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Business Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Business"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>WhatsApp Number *</label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="+1234567890"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your business"
                  style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., E-commerce, Services"
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  Create Business
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
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px'
  },
  emptyText: {
    color: '#64748b',
    marginBottom: '24px'
  },
  emptyButton: {
    padding: '12px 24px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },
  cardActions: {
    display: 'flex',
    gap: '8px'
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  cardPhone: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '8px'
  },
  cardDesc: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '16px',
    lineHeight: '1.5'
  },
  cardBadges: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#fff'
  },
  cardLinks: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  viewLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '13px'
  },
  link: {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '13px'
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

export default Businesses;