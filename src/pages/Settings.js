import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { businessApi } from '../services/api';
import toast from 'react-hot-toast';

const BUSINESS_TYPES = [
  { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'salon', label: 'Salon & Beauty', icon: '💇' },
  { value: 'medical', label: 'Medical & Healthcare', icon: '🏥' },
  { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
  { value: 'automotive', label: 'Automotive', icon: '🚗' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'travel', label: 'Travel & Tourism', icon: '✈️' },
  { value: 'other', label: 'Other', icon: '📋' }
];

const QUICK_ACTION_TYPES = [
  { value: 'menu', label: 'Main Menu' },
  { value: 'order', label: 'Place Order' },
  { value: 'track', label: 'Track Order' },
  { value: 'appointment', label: 'Book Appointment' },
  { value: 'quote', label: 'Request Quote' },
  { value: 'custom', label: 'Custom Action' }
];

const ToggleSwitch = ({ checked, onChange }) => (
  <label style={styles.switch}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      style={styles.hiddenCheckbox}
    />
    <span style={{
      ...styles.slider,
      backgroundColor: checked ? '#10b981' : '#cbd5e1'
    }}>
      <span style={{
        ...styles.sliderKnob,
        transform: checked ? 'translateX(24px)' : 'translateX(0)'
      }} />
    </span>
  </label>
);

const Settings = () => {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [editingQuickAction, setEditingQuickAction] = useState(null);
  const [quickActionForm, setQuickActionForm] = useState({ title: '', action: 'custom', description: '' });
  const [whatsappForm, setWhatsappForm] = useState({
    whatsappNumber: '',
    token: '',
    verifyToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookUrl: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    businessType: 'other',
    aiApiKey: '',
    aiPersonality: '',
    welcomeMessage: '',
    quickActions: [],
    settings: {
      autoReply: true,
      collectLeads: true,
      takeOrders: false,
      enableProductSearch: false,
      enableOrderFlow: false,
      enableAppointmentBooking: false,
      enableQuoteRequests: false
    }
  });

  useEffect(() => {
    fetchBusiness();
  }, [businessId]);

  const fetchBusiness = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}`);
      setBusiness(res.data.data);
      setFormData({
        name: res.data.data.name || '',
        description: res.data.data.description || '',
        category: res.data.data.category || '',
        businessType: res.data.data.businessType || 'other',
        aiApiKey: res.data.data.aiApiKey || '',
        aiPersonality: res.data.data.aiPersonality || '',
        welcomeMessage: res.data.data.welcomeMessage || '',
        quickActions: res.data.data.quickActions || [],
        settings: res.data.data.settings || {
          autoReply: true,
          collectLeads: true,
          takeOrders: false,
          enableProductSearch: false,
          enableOrderFlow: false,
          enableAppointmentBooking: false,
          enableQuoteRequests: false
        }
      });
    } catch (error) {
      toast.error('Failed to fetch business');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/businesses/${businessId}/settings`, formData);
      toast.success('Settings saved successfully!');
      fetchBusiness();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const connectWhatsApp = async () => {
    if (!whatsappForm.whatsappNumber || !whatsappForm.token || !whatsappForm.phoneNumberId) {
      toast.error('Please fill in Phone Number, Access Token, and Phone Number ID');
      return;
    }
    setConnecting(true);
    try {
      await businessApi.connectWhatsApp(businessId, {
        whatsappNumber: whatsappForm.whatsappNumber,
        token: whatsappForm.token,
        verifyToken: whatsappForm.verifyToken,
        phoneNumberId: whatsappForm.phoneNumberId,
        businessAccountId: whatsappForm.businessAccountId,
        webhookUrl: whatsappForm.webhookUrl
      });
      toast.success('WhatsApp connected successfully!');
      setShowWhatsAppForm(false);
      setWhatsappForm({ whatsappNumber: '', token: '', verifyToken: '', phoneNumberId: '', businessAccountId: '', webhookUrl: '' });
      fetchBusiness();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to connect WhatsApp');
    } finally {
      setConnecting(false);
    }
  };

  const testConnection = async () => {
    if (!testPhone) {
      toast.error('Please enter a test phone number');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await businessApi.testWhatsApp(businessId, { testPhoneNumber: testPhone });
      setTestResult({ success: true, message: result.data.message || 'Test message sent!' });
      toast.success('Test message sent!');
    } catch (error) {
      setTestResult({ success: false, message: error.response?.data?.message || 'Failed to send test' });
      toast.error(error.response?.data?.message || 'Failed to send test');
    } finally {
      setTesting(false);
    }
  };

  const openQuickActionModal = (action = null) => {
    if (action) {
      setEditingQuickAction(action.id);
      setQuickActionForm({ title: action.title, action: action.action, description: action.description || '' });
    } else {
      setEditingQuickAction(null);
      setQuickActionForm({ title: '', action: 'custom', description: '' });
    }
    setShowQuickActionModal(true);
  };

  const saveQuickAction = () => {
    if (!quickActionForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    const id = editingQuickAction || `action_${Date.now()}`;
    const newAction = { id, ...quickActionForm };
    
    let updatedActions;
    if (editingQuickAction) {
      updatedActions = formData.quickActions.map(a => a.id === editingQuickAction ? newAction : a);
    } else {
      updatedActions = [...formData.quickActions, newAction];
    }
    
    setFormData({ ...formData, quickActions: updatedActions.slice(0, 3) });
    setShowQuickActionModal(false);
  };

  const deleteQuickAction = (id) => {
    setFormData({ ...formData, quickActions: formData.quickActions.filter(a => a.id !== id) });
  };

  if (loading || !business) {
    return <div style={styles.loading}>Loading settings...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <Link to={`/businesses/${businessId}`} style={styles.backLink}>← Back to Business</Link>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>Configure your AI assistant</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Business Info Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Business Information</h2>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Business Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ ...styles.input, minHeight: '80px' }}
              placeholder="Brief description of your business"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Business Type</label>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              style={styles.select}
            >
              {BUSINESS_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            <p style={styles.helpText}>
              This helps AI understand your business context and respond appropriately.
            </p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Category (Optional)</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              style={styles.input}
              placeholder="e.g., Electronics, Fast Food, Hair Salon"
            />
          </div>
        </div>

        {/* AI Configuration Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>AI Configuration</h2>

          <div style={styles.inputGroup}>
            <label style={styles.label}>AI API Key (OpenRouter)</label>
            <input
              type="password"
              value={formData.aiApiKey}
              onChange={(e) => setFormData({ ...formData, aiApiKey: e.target.value })}
              style={styles.input}
              placeholder="sk-or-v1-..."
            />
            <p style={styles.helpText}>
              Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>openrouter.ai/keys</a>. This key is used for all AI features.
            </p>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>AI Personality</label>
            <textarea
              value={formData.aiPersonality}
              onChange={(e) => setFormData({ ...formData, aiPersonality: e.target.value })}
              style={{ ...styles.input, minHeight: '120px' }}
              placeholder="Describe how the AI should behave when talking to customers..."
            />
            <p style={styles.helpText}>
              Example: "You are a friendly and professional customer service assistant. Be helpful, concise, and always maintain a positive tone."
            </p>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Welcome Message</label>
            <textarea
              value={formData.welcomeMessage}
              onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
              style={{ ...styles.input, minHeight: '80px' }}
              placeholder="Message sent when a new customer contacts you..."
            />
            <p style={styles.helpText}>
              This message will be sent automatically to new customers.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Features</h2>
          
          <div style={styles.toggleGroup}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleLabel}>Auto Reply</span>
              <span style={styles.toggleDesc}>Automatically respond to customer messages using AI</span>
            </div>
            <ToggleSwitch
              checked={formData.settings.autoReply}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, autoReply: e.target.checked }
              })}
            />
          </div>

          <div style={styles.toggleGroup}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleLabel}>Collect Leads</span>
              <span style={styles.toggleDesc}>Automatically collect customer information as leads</span>
            </div>
            <ToggleSwitch
              checked={formData.settings.collectLeads}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, collectLeads: e.target.checked }
              })}
            />
          </div>

          <div style={styles.toggleGroup}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleLabel}>Take Orders</span>
              <span style={styles.toggleDesc}>Allow AI to process customer orders</span>
            </div>
            <ToggleSwitch
              checked={formData.settings.takeOrders}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, takeOrders: e.target.checked }
              })}
            />
          </div>

          <div style={styles.toggleGroup}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleLabel}>Product Search</span>
              <span style={styles.toggleDesc}>Allow AI to search and recommend products from catalog</span>
            </div>
            <ToggleSwitch
              checked={formData.settings.enableProductSearch}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, enableProductSearch: e.target.checked }
              })}
            />
          </div>

          <div style={styles.toggleGroup}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleLabel}>Order Flow</span>
              <span style={styles.toggleDesc}>Enable step-by-step order taking process</span>
            </div>
            <ToggleSwitch
              checked={formData.settings.enableOrderFlow}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, enableOrderFlow: e.target.checked }
              })}
            />
          </div>

          <div style={styles.toggleGroup}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleLabel}>Appointment Booking</span>
              <span style={styles.toggleDesc}>Allow customers to book appointments</span>
            </div>
            <ToggleSwitch
              checked={formData.settings.enableAppointmentBooking}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, enableAppointmentBooking: e.target.checked }
              })}
            />
          </div>

          <div style={styles.toggleGroup}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleLabel}>Quote Requests</span>
              <span style={styles.toggleDesc}>Allow customers to request price quotes</span>
            </div>
            <ToggleSwitch
              checked={formData.settings.enableQuoteRequests}
              onChange={(e) => setFormData({
                ...formData,
                settings: { ...formData.settings, enableQuoteRequests: e.target.checked }
              })}
            />
          </div>
        </div>

        {/* Quick Actions Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quick Actions Menu</h2>
          <p style={styles.sectionDesc}>
            Configure the quick action buttons shown to customers when they say "menu"
          </p>
          
          <div style={styles.quickActionsList}>
            {formData.quickActions.length === 0 ? (
              <p style={styles.emptyState}>No quick actions configured. Add up to 3 actions.</p>
            ) : (
              formData.quickActions.map((action, index) => (
                <div key={action.id} style={styles.quickActionItem}>
                  <div style={styles.quickActionInfo}>
                    <span style={styles.quickActionTitle}>{action.title}</span>
                    <span style={styles.quickActionType}>
                      {QUICK_ACTION_TYPES.find(t => t.value === action.action)?.label || 'Custom'}
                    </span>
                  </div>
                  <div style={styles.quickActionActions}>
                    <button
                      type="button"
                      onClick={() => openQuickActionModal(action)}
                      style={styles.editBtn}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuickAction(action.id)}
                      style={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {formData.quickActions.length < 3 && (
            <button
              type="button"
              onClick={() => openQuickActionModal()}
              style={styles.addBtn}
            >
              + Add Quick Action
            </button>
          )}
        </div>

        {/* WhatsApp Info */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>WhatsApp Connection</h2>
          
          {(!business.isWhatsAppConnected || showWhatsAppForm) ? (
            <>
              <p style={styles.helpText}>
                Enter your WhatsApp Business API credentials to connect.
                Get these from Meta for Developers → WhatsApp → API Setup.
              </p>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>WhatsApp Phone Number *</label>
                <input
                  type="text"
                  value={whatsappForm.whatsappNumber}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsappNumber: e.target.value })}
                  style={styles.input}
                  placeholder="+923361114012"
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Access Token *</label>
                <input
                  type="password"
                  value={whatsappForm.token}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, token: e.target.value })}
                  style={styles.input}
                  placeholder="Your WhatsApp Access Token"
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Verify Token (for webhook)</label>
                <input
                  type="text"
                  value={whatsappForm.verifyToken}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, verifyToken: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., mywebhooksecret123"
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number ID *</label>
                <input
                  type="text"
                  value={whatsappForm.phoneNumberId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, phoneNumberId: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., 796308443563112"
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Business Account ID</label>
                <input
                  type="text"
                  value={whatsappForm.businessAccountId}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, businessAccountId: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., 1746455262662287"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Webhook URL</label>
                <input
                  type="text"
                  value={whatsappForm.webhookUrl}
                  onChange={(e) => setWhatsappForm({ ...whatsappForm, webhookUrl: e.target.value })}
                  style={styles.input}
                  placeholder="e.g., https://yourdomain.com/webhook/whatsapp"
                />
              </div>
              
              <div style={styles.waFormActions}>
                <button 
                  type="button" 
                  onClick={connectWhatsApp}
                  disabled={connecting || !whatsappForm.whatsappNumber || !whatsappForm.token || !whatsappForm.phoneNumberId}
                  style={styles.connectBtn}
                >
                  {connecting ? 'Connecting...' : (business.isWhatsAppConnected ? 'Update Credentials' : 'Connect WhatsApp')}
                </button>
                {business.isWhatsAppConnected && (
                  <button 
                    type="button" 
                    onClick={() => setShowWhatsAppForm(false)}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={styles.infoCard}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Phone Number</span>
                  <span style={styles.infoValue}>{business.whatsappNumber}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Status</span>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: '#10b981'
                  }}>
                    Connected
                  </span>
                </div>
                {business.whatsappPhoneNumberId && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Phone Number ID</span>
                    <span style={styles.infoValue}>{business.whatsappPhoneNumberId}</span>
                  </div>
                )}
              </div>
              
              <button 
                type="button" 
                onClick={() => {
                  const creds = business.whatsappCredentials || {};
                  setWhatsappForm({
                    whatsappNumber: business.whatsappNumber || '',
                    token: creds.token || '',
                    verifyToken: creds.verifyToken || '',
                    phoneNumberId: creds.phoneNumberId || business.whatsappPhoneNumberId || '',
                    businessAccountId: creds.businessAccountId || ''
                  });
                  setShowWhatsAppForm(true);
                }}
                style={styles.editCredBtn}
              >
                Edit Credentials
              </button>
              
              {/* Test Connection Section */}
              <div style={styles.testConnectionSection}>
                <h4 style={styles.testTitle}>Test Connection</h4>
                <div style={styles.testRow}>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    style={styles.testInput}
                    placeholder="+923001234567"
                  />
                  <button 
                    type="button" 
                    onClick={testConnection}
                    disabled={testing || !testPhone}
                    style={styles.testBtn}
                  >
                    {testing ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
                {testResult && (
                  <p style={{
                    ...styles.testResult,
                    color: testResult.success ? '#10b981' : '#dc2626'
                  }}>
                    {testResult.message}
                  </p>
                )}
              </div>
              
              <div style={styles.webhookInfo}>
                <h4 style={styles.webhookTitle}>Webhook URL</h4>
                <code style={styles.webhookUrl}>
                  {business.whatsappCredentials?.webhookUrl || 'Not configured — set it in the form above'}
                </code>
                <p style={styles.webhookNote}>
                  Use this URL in your Meta Business App webhook configuration.
                </p>
                
                <div style={styles.verifyTokenBox}>
                  <strong style={styles.verifyTokenLabel}>Verify Token (use in Meta):</strong>
                  <code style={styles.verifyTokenValue}>
                    {business.whatsappCredentials?.verifyToken || 'Not configured'}
                  </code>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Save Button */}
        <div style={styles.actions}>
          <button type="submit" disabled={saving} style={styles.saveBtn}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Quick Action Modal */}
      {showQuickActionModal && (
        <div style={styles.modalOverlay} onClick={() => setShowQuickActionModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingQuickAction ? 'Edit Quick Action' : 'Add Quick Action'}
            </h3>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Title (Max 20 characters)</label>
              <input
                type="text"
                value={quickActionForm.title}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, title: e.target.value.slice(0, 20) })}
                style={styles.input}
                placeholder="e.g., View Products"
                maxLength={20}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Action Type</label>
              <select
                value={quickActionForm.action}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, action: e.target.value })}
                style={styles.select}
              >
                {QUICK_ACTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Description (Optional)</label>
              <input
                type="text"
                value={quickActionForm.description}
                onChange={(e) => setQuickActionForm({ ...quickActionForm, description: e.target.value })}
                style={styles.input}
                placeholder="Brief description of this action"
              />
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowQuickActionModal(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveQuickAction}
                style={styles.modalSaveBtn}
              >
                {editingQuickAction ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
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
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  helpText: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '6px'
  },
  toggleGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: '1px solid #e5e7eb'
  },
  toggleInfo: {
    flex: 1
  },
  toggleLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: '2px'
  },
  toggleDesc: {
    fontSize: '12px',
    color: '#64748b'
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '48px',
    height: '24px'
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#cbd5e1',
    borderRadius: '24px',
    transition: '0.2s',
    display: 'flex',
    alignItems: 'center'
  },
  sliderKnob: {
    width: '20px',
    height: '20px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    marginLeft: '2px',
    transition: 'transform 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
  },
  hiddenCheckbox: {
    opacity: 0,
    width: 0,
    height: 0,
    position: 'absolute'
  },
  // Note: Add this CSS via global styles or emotion for checkbox checked state
  // For simplicity, using inline styles with input[type="checkbox"]:checked ~ span
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb'
  },
  infoLabel: {
    fontSize: '13px',
    color: '#64748b'
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#fff'
  },
  webhookInfo: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px'
  },
  webhookTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px'
  },
  webhookUrl: {
    display: 'block',
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#2563eb',
    wordBreak: 'break-all',
    marginBottom: '8px'
  },
  webhookNote: {
    fontSize: '12px',
    color: '#64748b'
  },
  verifyTokenBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#fef3c7',
    borderRadius: '6px',
    border: '1px solid #fcd34d'
  },
  verifyTokenLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#92400e',
    marginBottom: '6px'
  },
  verifyTokenValue: {
    display: 'block',
    fontSize: '14px',
    color: '#b45309',
    fontWeight: '600',
    fontFamily: 'monospace'
  },
  connectBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px'
  },
  testConnectionSection: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bae6fd'
  },
  testTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: '12px'
  },
  testRow: {
    display: 'flex',
    gap: '12px'
  },
  testInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px'
  },
  testBtn: {
    padding: '10px 20px',
    backgroundColor: '#0284c7',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  testResult: {
    marginTop: '12px',
    fontSize: '13px',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  waFormActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px'
  },
  editCredBtn: {
    marginTop: '16px',
    padding: '10px 20px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  saveBtn: {
    padding: '14px 32px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer'
  },
  sectionDesc: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '16px',
    marginTop: '-12px'
  },
  quickActionsList: {
    marginBottom: '16px'
  },
  emptyState: {
    padding: '20px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  },
  quickActionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  quickActionInfo: {
    flex: 1
  },
  quickActionTitle: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b'
  },
  quickActionType: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px'
  },
  quickActionActions: {
    display: 'flex',
    gap: '8px'
  },
  editBtn: {
    padding: '6px 12px',
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  deleteBtn: {
    padding: '6px 12px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  addBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    border: '1px dashed #86efac',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
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
    padding: '24px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '20px'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  modalSaveBtn: {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
};

export default Settings;