import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { knowledgeApi } from '../services/api';
import toast from 'react-hot-toast';

const KnowledgeBase = () => {
  const { businessId } = useParams();
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState(null);
  const [testingAI, setTestingAI] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: ''
  });

  useEffect(() => {
    fetchKnowledge();
  }, [businessId]);

  const fetchKnowledge = async () => {
    try {
      const res = await knowledgeApi.getAll(businessId);
      setKnowledge(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch knowledge base');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm('This will add sample FAQs, products info, and policies. Continue?')) return;
    setSeeding(true);
    try {
      const res = await knowledgeApi.seed(businessId);
      if (res.data.success) {
        toast.success(`Added ${res.data.count} sample entries!`);
        fetchKnowledge();
      } else {
        toast.error(res.data.message || 'Failed to seed data');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to seed data');
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await knowledgeApi.create(businessId, {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      });
      toast.success('Knowledge added successfully!');
      setShowModal(false);
      setFormData({ title: '', content: '', category: 'general', tags: '' });
      fetchKnowledge();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add knowledge');
    }
  };

  const handleDelete = async (knowledgeId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/businesses/${businessId}/knowledge/${knowledgeId}`);
      toast.success('Knowledge deleted!');
      fetchKnowledge();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const testAI = async () => {
    if (!testMessage.trim()) return;
    setTestingAI(true);
    try {
      const res = await api.post(`/businesses/${businessId}/ai/test`, { message: testMessage });
      setTestResponse(res.data.data);
    } catch (error) {
      toast.error('Failed to test AI');
    } finally {
      setTestingAI(false);
    }
  };

  const categories = [
    { value: 'faq', label: 'FAQ', icon: '❓' },
    { value: 'product', label: 'Product', icon: '📦' },
    { value: 'policy', label: 'Policy', icon: '📋' },
    { value: 'general', label: 'General', icon: '📝' },
    { value: 'custom', label: 'Custom', icon: '⚙️' }
  ];

  if (loading) {
    return <div style={styles.loading}>Loading knowledge base...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <Link to={`/businesses/${businessId}`} style={styles.backLink}>← Back to Business</Link>
          <h1 style={styles.title}>Knowledge Base</h1>
          <p style={styles.subtitle}>Train your AI with custom knowledge</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleSeedData} 
            disabled={seeding || knowledge.length > 0}
            style={{
              ...styles.seedButton,
              opacity: (seeding || knowledge.length > 0) ? 0.5 : 1
            }}
            title={knowledge.length > 0 ? 'Already has data' : 'Add sample FAQs and product info'}
          >
            {seeding ? '⏳ Seeding...' : '🌱 Seed Sample Data'}
          </button>
          <button onClick={() => setShowModal(true)} style={styles.addButton}>
            + Add Knowledge
          </button>
        </div>
      </div>

      {/* Test AI Section */}
      <div style={styles.testSection}>
        <h2 style={styles.sectionTitle}>Test AI Response</h2>
        <div style={styles.testContainer}>
          <div style={styles.testInput}>
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Type a message to test the AI..."
              style={styles.input}
            />
            <button onClick={testAI} disabled={testingAI} style={styles.testBtn}>
              {testingAI ? 'Testing...' : 'Test'}
            </button>
          </div>
          {testResponse && (
            <div style={styles.testResult}>
              <div style={styles.testLabel}>AI Response:</div>
              <p style={styles.testResponse}>{testResponse.response}</p>
              {testResponse.sources?.length > 0 && (
                <div style={styles.sources}>
                  <span style={styles.sourcesLabel}>Sources: </span>
                  {testResponse.sources.map((s, i) => (
                    <span key={i} style={styles.sourceBadge}>{s.title}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Knowledge Base List */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Knowledge Items ({knowledge.length})</h2>
        {knowledge.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No knowledge base items yet</p>
            <button onClick={() => setShowModal(true)} style={styles.emptyButton}>
              Add your first knowledge item
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {knowledge.map((item) => {
              const category = categories.find(c => c.value === item.category);
              return (
                <div key={item._id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardIcon}>{category?.icon || '📝'}</span>
                    <button onClick={() => handleDelete(item._id)} style={styles.deleteBtn}>
                      Delete
                    </button>
                  </div>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <p style={styles.cardContent}>
                    {item.content.length > 150 ? item.content.substring(0, 150) + '...' : item.content}
                  </p>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardCategory}>{category?.label || item.category}</span>
                    {item.tags?.length > 0 && (
                      <div style={styles.tags}>
                        {item.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} style={styles.tag}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Knowledge Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Add Knowledge</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Shipping Policy"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={styles.select}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the knowledge content that the AI will use to answer questions..."
                  style={{ ...styles.input, minHeight: '150px' }}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="shipping, delivery, policy"
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  Add Knowledge
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
  seedButton: {
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  testSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px'
  },
  testContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  testInput: {
    display: 'flex',
    gap: '12px'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  select: {
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff'
  },
  testBtn: {
    padding: '12px 24px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  testResult: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px'
  },
  testLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '8px'
  },
  testResponse: {
    fontSize: '14px',
    color: '#1e293b',
    lineHeight: '1.6',
    marginBottom: '12px'
  },
  sources: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  sourcesLabel: {
    fontSize: '12px',
    color: '#64748b'
  },
  sourceBadge: {
    padding: '2px 8px',
    backgroundColor: '#dbeafe',
    color: '#2563eb',
    borderRadius: '4px',
    fontSize: '11px'
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  emptyText: {
    color: '#64748b',
    marginBottom: '16px'
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px'
  },
  card: {
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '10px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  cardIcon: {
    fontSize: '24px'
  },
  deleteBtn: {
    padding: '4px 10px',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px'
  },
  cardContent: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.5',
    marginBottom: '12px'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardCategory: {
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderRadius: '20px',
    fontSize: '11px'
  },
  tags: {
    display: 'flex',
    gap: '4px'
  },
  tag: {
    padding: '2px 8px',
    backgroundColor: '#e0f2fe',
    color: '#0284c7',
    borderRadius: '4px',
    fontSize: '10px'
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
    maxWidth: '600px',
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

export default KnowledgeBase;