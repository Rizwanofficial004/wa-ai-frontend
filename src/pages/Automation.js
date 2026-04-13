import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { automationApi } from '../services/api';
import ViewToggle from '../components/ViewToggle';

const AutomationRules = () => {
  const { businessId } = useParams();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'keyword',
    keywords: '',
    actions: [],
    isActive: true
  });

  useEffect(() => {
    fetchRules();
  }, [businessId]);

  const fetchRules = async () => {
    try {
      const response = await automationApi.getAll(businessId);
      setRules(response.data.data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId) => {
    try {
      await automationApi.toggle(businessId, ruleId);
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      await automationApi.delete(businessId, ruleId);
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        trigger: {
          type: formData.triggerType,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
        },
        actions: [{ type: 'send_message', message: 'Auto reply' }]
      };

      if (editingRule) {
        await automationApi.update(businessId, editingRule._id, data);
      } else {
        await automationApi.create(businessId, data);
      }
      setShowModal(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      triggerType: 'keyword',
      keywords: '',
      actions: [],
      isActive: true
    });
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      triggerType: rule.trigger?.type || 'keyword',
      keywords: rule.trigger?.keywords?.join(', ') || '',
      actions: rule.actions || [],
      isActive: rule.isActive
    });
    setShowModal(true);
  };

  if (loading) {
    return <div style={styles.loading}>Loading automation rules...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Automation Rules</h1>
          <p style={styles.subtitle}>Create rules to automate customer interactions</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ViewToggle view={view} onViewChange={setView} />
          <button onClick={() => { resetForm(); setEditingRule(null); setShowModal(true); }} style={styles.addBtn}>
            + New Rule
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div style={styles.rulesList}>
        {rules.length === 0 ? (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>⚡</span>
            <h3>No automation rules yet</h3>
            <p>Create rules to automatically respond to customer messages, assign agents, and more.</p>
          </div>
        ) : view === 'card' ? (
          /* Card View */
          rules.map((rule) => (
            <div key={rule._id} style={styles.ruleCard}>
              <div style={styles.ruleHeader}>
                <div style={styles.ruleInfo}>
                  <h3 style={styles.ruleName}>{rule.name}</h3>
                  <p style={styles.ruleDescription}>{rule.description || 'No description'}</p>
                </div>
                <div style={styles.ruleActions}>
                  <button
                    onClick={() => handleToggleRule(rule._id)}
                    style={{
                      ...styles.toggleBtn,
                      backgroundColor: rule.isActive ? '#10b981' : '#e2e8f0'
                    }}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button onClick={() => openEditModal(rule)} style={styles.editBtn}>✏️</button>
                  <button onClick={() => handleDeleteRule(rule._id)} style={styles.deleteBtn}>🗑️</button>
                </div>
              </div>
              
              <div style={styles.ruleDetails}>
                <div style={styles.triggerInfo}>
                  <span style={styles.label}>Trigger:</span>
                  <span style={styles.value}>{rule.trigger?.type}</span>
                </div>
                {rule.trigger?.keywords?.length > 0 && (
                  <div style={styles.keywordsContainer}>
                    {rule.trigger.keywords.map((kw, i) => (
                      <span key={i} style={styles.keyword}>{kw}</span>
                    ))}
                  </div>
                )}
                <div style={styles.actionsInfo}>
                  <span style={styles.label}>Actions:</span>
                  <span style={styles.value}>
                    {rule.actions?.map(a => a.type).join(', ') || 'None'}
                  </span>
                </div>
              </div>

              <div style={styles.ruleStats}>
                <span>Triggered: {rule.stats?.totalTriggers || 0} times</span>
                {rule.lastExecutedAt && (
                  <span>Last: {new Date(rule.lastExecutedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))
        ) : (
          /* List View */
          <div style={styles.listContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Rule Name</th>
                  <th style={styles.th}>Trigger</th>
                  <th style={styles.th}>Keywords</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Triggered</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule._id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{rule.name}</strong>
                      {rule.description && <p style={styles.tdDescription}>{rule.description}</p>}
                    </td>
                    <td style={styles.td}>{rule.trigger?.type || '-'}</td>
                    <td style={styles.td}>
                      {rule.trigger?.keywords?.map((kw, i) => (
                        <span key={i} style={styles.keyword}>{kw}</span>
                      ))}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleToggleRule(rule._id)}
                        style={{
                          ...styles.toggleBtn,
                          backgroundColor: rule.isActive ? '#10b981' : '#e2e8f0'
                        }}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={styles.td}>{rule.stats?.totalTriggers || 0}</td>
                    <td style={styles.td}>
                      <button onClick={() => openEditModal(rule)} style={styles.editBtn}>✏️</button>
                      <button onClick={() => handleDeleteRule(rule._id)} style={styles.deleteBtn}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {editingRule ? 'Edit Rule' : 'Create New Rule'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Rule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  placeholder="e.g., Auto-respond to 'price' queries"
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{...styles.input, height: '60px'}}
                  placeholder="What does this rule do?"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Trigger Type</label>
                <select
                  value={formData.triggerType}
                  onChange={(e) => setFormData({...formData, triggerType: e.target.value})}
                  style={styles.input}
                >
                  <option value="keyword">Keyword Match</option>
                  <option value="message_exact">Exact Match</option>
                  <option value="first_message">First Message</option>
                  <option value="time_based">Time Based</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Keywords (comma separated)</label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  style={styles.input}
                  placeholder="price, cost, how much"
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  {editingRule ? 'Update Rule' : 'Create Rule'}
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
  rulesList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  empty: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  emptyIcon: { fontSize: '48px', display: 'block', marginBottom: '16px' },
  ruleCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  ruleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  ruleInfo: { flex: 1 },
  ruleName: { margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' },
  ruleDescription: { margin: 0, fontSize: '14px', color: '#64748b' },
  ruleActions: { display: 'flex', gap: '8px', alignItems: 'center' },
  toggleBtn: { padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '500', color: '#fff' },
  editBtn: { padding: '8px 12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  deleteBtn: { padding: '8px 12px', backgroundColor: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  ruleDetails: { borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginBottom: '12px' },
  triggerInfo: { marginBottom: '8px' },
  label: { fontSize: '12px', fontWeight: '600', color: '#64748b', marginRight: '8px' },
  value: { fontSize: '14px', color: '#0f172a' },
  keywordsContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' },
  keyword: { padding: '4px 12px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '4px', fontSize: '12px' },
  actionsInfo: { marginBottom: '8px' },
  ruleStats: { display: 'flex', gap: '24px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '12px' },
  listContainer: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#0f172a', verticalAlign: 'middle' },
  tdDescription: { margin: '2px 0 0', fontSize: '12px', color: '#64748b' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '500px', maxWidth: '90%' },
  modalTitle: { margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' },
  formGroup: { marginBottom: '16px' },
  formLabel: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  submitBtn: { padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

export default AutomationRules;
