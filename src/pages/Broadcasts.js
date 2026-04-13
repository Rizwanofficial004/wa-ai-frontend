import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { broadcastApi, tagApi } from '../services/api';
import ViewToggle from '../components/ViewToggle';

const Broadcasts = () => {
  const { businessId } = useParams();
  const [broadcasts, setBroadcasts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    messageType: 'text',
    targetType: 'all',
    targetTags: [],
    scheduledAt: ''
  });
  const [targetPreview, setTargetPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const fetchData = async () => {
    try {
      const [broadcastsRes, tagsRes] = await Promise.all([
        broadcastApi.getAll(businessId),
        tagApi.getAll(businessId)
      ]);
      setBroadcasts(broadcastsRes.data.broadcasts || []);
      setTags(tagsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = async (targetType) => {
    setFormData({...formData, targetType});
    try {
      const res = await broadcastApi.getTargetPreview(businessId, { type: targetType });
      setTargetPreview(res.data);
    } catch (error) {
      console.error('Error getting target preview:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        message: formData.message,
        messageType: formData.messageType,
        target: {
          type: formData.targetType,
          tags: formData.targetType === 'tag' ? formData.targetTags : undefined
        },
        scheduledAt: formData.scheduledAt || undefined
      };

      await broadcastApi.create(businessId, data);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating broadcast:', error);
    }
  };

  const handleStartBroadcast = async (broadcastId) => {
    if (!window.confirm('Are you sure you want to send this broadcast?')) return;
    try {
      await broadcastApi.start(businessId, broadcastId);
      fetchData();
    } catch (error) {
      console.error('Error starting broadcast:', error);
    }
  };

  const handleCancelBroadcast = async (broadcastId) => {
    try {
      await broadcastApi.cancel(businessId, broadcastId);
      fetchData();
    } catch (error) {
      console.error('Error cancelling broadcast:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      message: '',
      messageType: 'text',
      targetType: 'all',
      targetTags: [],
      scheduledAt: ''
    });
    setTargetPreview(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#64748b',
      scheduled: '#f59e0b',
      sending: '#3b82f6',
      sent: '#10b981',
      failed: '#ef4444',
      cancelled: '#6b7280'
    };
    return colors[status] || '#64748b';
  };

  if (loading) {
    return <div style={styles.loading}>Loading broadcasts...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Broadcast Messages</h1>
          <p style={styles.subtitle}>Send messages to your customers</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ViewToggle view={view} onViewChange={setView} />
          <button onClick={() => { resetForm(); setShowModal(true); }} style={styles.addBtn}>
            + New Broadcast
          </button>
        </div>
      </div>

      {/* Broadcasts List */}
      <div style={styles.broadcastsList}>
        {broadcasts.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>📢</span>
            <h3>No broadcasts yet</h3>
            <p>Create your first broadcast to send messages to your customers.</p>
          </div>
        ) : view === 'card' ? (
          /* Card View */
          broadcasts.map((broadcast) => (
            <div key={broadcast._id} style={styles.broadcastCard}>
              <div style={styles.broadcastHeader}>
                <div style={styles.broadcastInfo}>
                  <h3 style={styles.broadcastName}>{broadcast.name}</h3>
                  <p style={styles.broadcastMessage}>
                    {broadcast.message?.substring(0, 100)}
                    {broadcast.message?.length > 100 ? '...' : ''}
                  </p>
                </div>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(broadcast.status) + '20',
                  color: getStatusColor(broadcast.status)
                }}>
                  {broadcast.status}
                </span>
              </div>

              <div style={styles.broadcastStats}>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{broadcast.stats?.totalTargeted || 0}</span>
                  <span style={styles.statLabel}>Targeted</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{broadcast.stats?.sent || 0}</span>
                  <span style={styles.statLabel}>Sent</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{broadcast.stats?.delivered || 0}</span>
                  <span style={styles.statLabel}>Delivered</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{broadcast.stats?.read || 0}</span>
                  <span style={styles.statLabel}>Read</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{broadcast.stats?.failed || 0}</span>
                  <span style={styles.statLabel}>Failed</span>
                </div>
              </div>

              <div style={styles.broadcastFooter}>
                <span style={styles.date}>
                  Created: {new Date(broadcast.createdAt).toLocaleDateString()}
                </span>
                <div style={styles.broadcastActions}>
                  {broadcast.status === 'draft' && (
                    <>
                      <button onClick={() => handleStartBroadcast(broadcast._id)} style={styles.sendBtn}>
                        Send Now
                      </button>
                      <button onClick={() => handleCancelBroadcast(broadcast._id)} style={styles.cancelBtn}>
                        Delete
                      </button>
                    </>
                  )}
                  {broadcast.status === 'sending' && (
                    <button onClick={() => handleCancelBroadcast(broadcast._id)} style={styles.cancelBtn}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          /* List View */
          <div style={styles.listContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Message</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Sent/Delivered</th>
                  <th style={styles.th}>Failed</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((broadcast) => (
                  <tr key={broadcast._id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{broadcast.name}</strong>
                      <p style={styles.tdDate}>{new Date(broadcast.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td style={styles.td}>
                      {broadcast.message?.substring(0, 50)}
                      {broadcast.message?.length > 50 ? '...' : ''}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(broadcast.status) + '20',
                        color: getStatusColor(broadcast.status)
                      }}>
                        {broadcast.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {broadcast.stats?.sent || 0} / {broadcast.stats?.delivered || 0}
                    </td>
                    <td style={styles.td}>{broadcast.stats?.failed || 0}</td>
                    <td style={styles.td}>
                      {broadcast.status === 'draft' && (
                        <>
                          <button onClick={() => handleStartBroadcast(broadcast._id)} style={styles.sendBtn}>
                            Send
                          </button>
                          <button onClick={() => handleCancelBroadcast(broadcast._id)} style={styles.deleteBtn}>
                            Delete
                          </button>
                        </>
                      )}
                      {broadcast.status === 'sending' && (
                        <button onClick={() => handleCancelBroadcast(broadcast._id)} style={styles.cancelBtn}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Create Broadcast</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Broadcast Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  placeholder="e.g., Summer Sale Announcement"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  style={{...styles.input, height: '100px'}}
                  placeholder="Write your message here..."
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Target Audience</label>
                <select
                  value={formData.targetType}
                  onChange={(e) => handleTargetChange(e.target.value)}
                  style={styles.input}
                >
                  <option value="all">All Customers</option>
                  <option value="tag">Customers with Tag</option>
                  <option value="leads">All Leads</option>
                  <option value="no_orders">Customers without Orders</option>
                  <option value="inactive">Inactive Customers (30+ days)</option>
                </select>
                {targetPreview && (
                  <p style={styles.previewText}>
                    📊 {targetPreview.count} recipients will receive this message
                  </p>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtnModal}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  Create Broadcast
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
  container: { maxWidth: '1000px', margin: '0 auto' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  addBtn: { padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
  broadcastsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  empty: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },
  broadcastCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  broadcastHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  broadcastInfo: { flex: 1 },
  broadcastName: { margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' },
  broadcastMessage: { margin: 0, fontSize: '14px', color: '#64748b' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' },
  broadcastStats: { display: 'flex', gap: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '16px' },
  statItem: { textAlign: 'center' },
  statValue: { display: 'block', fontSize: '20px', fontWeight: '600', color: '#0f172a' },
  statLabel: { fontSize: '11px', color: '#64748b' },
  broadcastFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' },
  date: { fontSize: '12px', color: '#64748b' },
  broadcastActions: { display: 'flex', gap: '8px' },
  sendBtn: { padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '12px' },
  cancelBtn: { padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  listContainer: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#0f172a', verticalAlign: 'middle' },
  tdDate: { margin: '2px 0 0', fontSize: '12px', color: '#64748b' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90%' },
  modalTitle: { margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' },
  formGroup: { marginBottom: '16px' },
  formLabel: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  previewText: { margin: '8px 0 0', fontSize: '13px', color: '#10b981' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
  cancelBtnModal: { padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  submitBtn: { padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

export default Broadcasts;
