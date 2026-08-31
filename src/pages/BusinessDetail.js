import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { businessApi } from '../services/api';
import toast from 'react-hot-toast';

const defaultWebhookUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3003/api';
  return `${String(apiUrl).replace(/\/api\/?$/, '')}/webhook/whatsapp`;
};

const newVerifyToken = () =>
  process.env.REACT_APP_WHATSAPP_VERIFY_TOKEN || 'mywebhooksecret123';

const isLocalWebhookUrl = (url) =>
  /localhost|127\.0\.0\.1/.test(String(url || ''));

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
    token: '',
    verifyToken: newVerifyToken(),
    phoneNumberId: '',
    businessAccountId: '',
    webhookUrl: defaultWebhookUrl()
  });
  const [connecting, setConnecting] = useState(false);
  const [showWebhookSteps, setShowWebhookSteps] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);

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
      const creds = res.data.data.whatsappCredentials || {};
      setWhatsappForm({
        whatsappNumber: res.data.data.whatsappNumber || '',
        token: creds.token || '',
        verifyToken: creds.verifyToken || newVerifyToken(),
        phoneNumberId: creds.phoneNumberId || res.data.data.whatsappPhoneNumberId || '',
        businessAccountId: creds.businessAccountId || '',
        webhookUrl: creds.webhookUrl || defaultWebhookUrl()
      });
      setShowWebhookSteps(Boolean(res.data.data.isWhatsAppConnected));
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

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy');
    }
  };

  const handleConnectWhatsApp = async (e) => {
    e.preventDefault();
    if (!whatsappForm.whatsappNumber || !whatsappForm.token || !whatsappForm.phoneNumberId) {
      toast.error('Phone number, access token, and phone number ID are required');
      return;
    }
    setConnecting(true);
    try {
      const res = await businessApi.connectWhatsApp(businessId, whatsappForm);
      const creds = res.data.data?.whatsappCredentials || {};
      setWhatsappForm((prev) => ({
        ...prev,
        verifyToken: creds.verifyToken || prev.verifyToken,
        webhookUrl: creds.webhookUrl || prev.webhookUrl
      }));
      setShowWebhookSteps(true);
      toast.success('WhatsApp connected. AI auto-reply is on.');
      fetchBusiness();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to connect WhatsApp');
    } finally {
      setConnecting(false);
    }
  };

  const handleTestWhatsApp = async () => {
    const raw = (testPhone || '').trim();
    if (!raw) {
      toast.error('Enter the recipient mobile number, e.g. +923041493401');
      return;
    }
    if (!/\d{8,}/.test(raw.replace(/\D/g, '')) || /[a-zA-Z]/.test(raw)) {
      toast.error('This field is a phone number, not a chat message. Example: +923041493401');
      return;
    }
    setTesting(true);
    try {
      await businessApi.testWhatsApp(businessId, { testPhoneNumber: raw });
      toast.success('Test message sent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Test message failed');
    } finally {
      setTesting(false);
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
            <h2 style={styles.modalTitle}>Connect WhatsApp bot</h2>
            <p style={styles.helpText}>
              Paste credentials from Meta for Developers → WhatsApp → API Setup.
              After connect, every customer message gets an AI auto-reply while the chatbot is enabled.
            </p>
            <form onSubmit={handleConnectWhatsApp} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>WhatsApp Business Number *</label>
                <input
                  type="text"
                  value={whatsappForm.whatsappNumber}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappNumber: e.target.value })}
                  placeholder="+923001234567"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Access Token * (paste new, then click Update & verify)</label>
                <input
                  type="password"
                  value={whatsappForm.token}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, token: e.target.value })}
                  placeholder="Temporary or System User token from Meta"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number ID *</label>
                <input
                  type="text"
                  value={whatsappForm.phoneNumberId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, phoneNumberId: e.target.value })}
                  placeholder="From Meta API Setup"
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>WhatsApp Business Account ID</label>
                <input
                  type="text"
                  value={whatsappForm.businessAccountId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, businessAccountId: e.target.value })}
                  placeholder="Optional"
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Verify token (same value in Meta webhook)</label>
                <input
                  type="text"
                  value={whatsappForm.verifyToken}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, verifyToken: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Webhook URL (public HTTPS, e.g. ngrok)</label>
                <input
                  type="text"
                  value={whatsappForm.webhookUrl}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, webhookUrl: e.target.value })}
                  placeholder="https://xxxx.ngrok-free.app/webhook/whatsapp"
                  style={styles.input}
                />
                <span style={styles.fieldHint}>
                  Meta cannot reach localhost. You need a public HTTPS URL that forwards to port 3003.
                </span>
                {isLocalWebhookUrl(whatsappForm.webhookUrl) && (
                  <div style={styles.localWarn}>
                    This URL is localhost — Meta will reject it. In a new terminal run
                    {' '}<code>npx --yes cloudflared tunnel --url http://localhost:3003</code>
                    {' '}then paste <code>https://YOUR-TUNNEL/webhook/whatsapp</code> as the callback URL.
                  </div>
                )}
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowWhatsAppModal(false)} style={styles.cancelBtn}>
                  {showWebhookSteps ? 'Done' : 'Cancel'}
                </button>
                <button type="submit" disabled={connecting} style={styles.submitBtn}>
                  {connecting ? 'Connecting...' : (business.isWhatsAppConnected ? 'Update & verify' : 'Connect bot')}
                </button>
              </div>
            </form>

            {showWebhookSteps && (
              <div style={styles.stepsBox}>
                <h3 style={styles.stepsTitle}>Finish in Meta so replies can arrive</h3>
                <ol style={styles.stepsList}>
                  <li>WhatsApp → Configuration → Webhook</li>
                  <li>Callback URL — paste the webhook URL below</li>
                  <li>Verify token — paste the token below</li>
                  <li>Subscribe to <strong>messages</strong></li>
                </ol>
                <div style={styles.copyRow}>
                  <code style={styles.codeValue}>{whatsappForm.webhookUrl || 'Set a public webhook URL'}</code>
                  <button
                    type="button"
                    style={styles.copyBtn}
                    onClick={() => copyText(whatsappForm.webhookUrl, 'Webhook URL')}
                    disabled={!whatsappForm.webhookUrl}
                  >
                    Copy
                  </button>
                </div>
                <div style={styles.copyRow}>
                  <code style={styles.codeValue}>{whatsappForm.verifyToken}</code>
                  <button
                    type="button"
                    style={styles.copyBtn}
                    onClick={() => copyText(whatsappForm.verifyToken, 'Verify token')}
                  >
                    Copy
                  </button>
                </div>
                <div style={styles.testRow}>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+923041493401"
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    disabled={testing}
                    style={styles.submitBtn}
                  >
                    {testing ? 'Sending...' : 'Send test'}
                  </button>
                </div>
                <span style={styles.fieldHint}>
                  Your phone that has WhatsApp, with country code. Example: +923041493401.
                  Do not use the business number. Local 03… is converted to +92… automatically.
                </span>
              </div>
            )}
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
    maxWidth: '560px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px'
  },
  helpText: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: 1.5,
    marginBottom: '20px'
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
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  fieldHint: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: 1.4
  },
  localWarn: {
    marginTop: '8px',
    padding: '10px 12px',
    backgroundColor: '#fff7ed',
    border: '1px solid #fdba74',
    borderRadius: '8px',
    color: '#9a3412',
    fontSize: '12px',
    lineHeight: 1.5
  },
  stepsBox: {
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  stepsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px'
  },
  stepsList: {
    margin: '0 0 16px',
    paddingLeft: '18px',
    color: '#475569',
    fontSize: '13px',
    lineHeight: 1.6
  },
  copyRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px'
  },
  codeValue: {
    flex: 1,
    fontSize: '12px',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 12px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  copyBtn: {
    padding: '10px 12px',
    backgroundColor: '#e2e8f0',
    color: '#334155',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  testRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px'
  }
};

export default BusinessDetail;