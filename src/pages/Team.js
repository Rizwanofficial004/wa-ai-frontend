import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { agentApi, inviteApi } from '../services/api';
import ViewToggle from '../components/ViewToggle';

const TeamManagement = () => {
  const { businessId } = useParams();
  const [agents, setAgents] = useState([]);
  const [invites, setInvites] = useState([]);
  const [onlineAgents, setOnlineAgents] = useState([]);
  const [handoffQueue, setHandoffQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [view, setView] = useState('card');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviteLink, setInviteLink] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [businessId]);

  const fetchData = async () => {
    try {
      const [agentsRes, onlineRes, queueRes, invitesRes] = await Promise.all([
        agentApi.getAll(businessId),
        agentApi.getOnline(businessId),
        agentApi.getHandoffQueue(businessId),
        inviteApi.getAll(businessId)
      ]);
      
      const allAgents = agentsRes.data?.data || agentsRes.data || [];
      const onlineAgentsList = onlineRes.data?.data || onlineRes.data || [];
      const handoffData = queueRes.data?.data || queueRes.data || [];
      const allInvites = invitesRes.data?.data || invitesRes.data || [];
      
      setAgents(allAgents);
      setOnlineAgents(onlineAgentsList);
      setHandoffQueue(handoffData);
      setInvites(allInvites);
    } catch (error) {
      console.error('Error fetching data:', error);
      setAgents([]);
      setInvites([]);
      setOnlineAgents([]);
      setHandoffQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    try {
      const result = await inviteApi.create(businessId, { email: inviteEmail, role: inviteRole });
      const data = result.data.data || result.data;
      
      if (data.addedDirectly || data.reactivated) {
        // User was added directly (existing user)
        alert(data.message || 'Team member added successfully!');
        setShowInviteModal(false);
        setInviteEmail('');
      } else {
        // New invite was created
        setInviteLink(data.inviteLink);
        setPendingInvite(data.invite);
      }
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  const sendViaWhatsApp = async () => {
    if (!invitePhone || !pendingInvite) return;
    try {
      const result = await inviteApi.sendViaWhatsApp(businessId, pendingInvite._id, invitePhone);
      if (result.data.success) {
        alert('Invite sent via WhatsApp!');
        setShowInviteModal(false);
        setInviteLink(null);
        setPendingInvite(null);
        setInvitePhone('');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send invite via WhatsApp');
    }
  };

  const handleCancelInvite = async (inviteId) => {
    if (!window.confirm('Cancel this invite?')) return;
    try {
      await inviteApi.cancel(businessId, inviteId);
      fetchData();
    } catch (error) {
      console.error('Error cancelling invite:', error);
    }
  };

  const handleResendInvite = async (inviteId) => {
    try {
      const result = await inviteApi.resend(businessId, inviteId);
      setInviteLink(result.data.inviteLink);
      fetchData();
    } catch (error) {
      console.error('Error resending invite:', error);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied!');
  };

    const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) return;
    try {
      await agentApi.delete(businessId, agentId);
      fetchData();
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading team...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Team Management</h1>
          <p style={styles.subtitle}>Manage agents and chat assignments</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ViewToggle view={view} onViewChange={setView} />
          <button onClick={() => { setInviteLink(null); setShowInviteModal(true); }} style={styles.addBtn}>
            + Invite Agent
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{agents.length}</span>
          <span style={styles.statLabel}>Total Agents</span>
        </div>
        <div style={{ ...styles.statCard, backgroundColor: '#dcfce7' }}>
          <span style={{ ...styles.statValue, color: '#16a34a' }}>{onlineAgents.length}</span>
          <span style={styles.statLabel}>Online Now</span>
        </div>
        <div style={{ ...styles.statCard, backgroundColor: '#fef3c7' }}>
          <span style={{ ...styles.statValue, color: '#d97706' }}>{handoffQueue.length}</span>
          <span style={styles.statLabel}>Pending Handoffs</span>
        </div>
        <div style={{ ...styles.statCard, backgroundColor: '#e0e7ff' }}>
          <span style={{ ...styles.statValue, color: '#4338ca' }}>{invites.filter(i => i.status === 'pending').length}</span>
          <span style={styles.statLabel}>Pending Invites</span>
        </div>
      </div>

      {/* Pending Invites */}
      {invites.filter(i => i.status === 'pending').length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📧 Pending Invites</h3>
          <div style={styles.invitesList}>
            {invites.filter(i => i.status === 'pending').map((invite) => (
              <div key={invite._id} style={styles.inviteItem}>
                <div style={styles.inviteInfo}>
                  <strong>{invite.email}</strong>
                  <span style={styles.inviteRole}>{invite.role}</span>
                  <p style={styles.inviteTime}>
                    Sent {new Date(invite.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={styles.inviteActions}>
                  <button onClick={() => handleResendInvite(invite._id)} style={styles.resendBtn}>
                    Resend
                  </button>
                  <button onClick={() => handleCancelInvite(invite._id)} style={styles.cancelBtnSmall}>
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Handoff Queue */}
      {handoffQueue.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>🚨 Pending Handoffs</h3>
          <div style={styles.handoffList}>
            {handoffQueue.map((item, index) => (
              <div key={index} style={styles.handoffItem}>
                <div>
                  <strong>{item.conversation?.customerName || item.conversation?.customerPhone}</strong>
                  <p style={styles.handoffReason}>Reason: {item.reason}</p>
                  <p style={styles.handoffTime}>
                    {new Date(item.requestedAt).toLocaleString()}
                  </p>
                </div>
                <Link
                  to={`/businesses/${businessId}/conversations?open=${item.conversationId || item.conversation?._id}`}
                  style={styles.acceptBtn}
                >
                  Reply in Inbox
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents List */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>👥 All Agents ({agents.length})</h3>
        
        {view === 'card' ? (
          /* Card View */
          <div style={styles.agentsGrid}>
            {agents.map((agent) => {
              const agentEmail = agent.email || agent.user?.email || 'No email';
              const isOnline = agent.status === 'online' || agent.status === 'busy';
              return (
                <div key={agent._id} style={styles.agentCard}>
                  <div style={styles.agentHeader}>
                    <div style={styles.agentAvatar}>
                      {agent.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div style={styles.agentInfo}>
                      <h4 style={styles.agentName}>{agent.name}</h4>
                      <span style={styles.agentEmail}>{agentEmail}</span>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: isOnline ? '#dcfce7' : '#f1f5f9',
                      color: isOnline ? '#16a34a' : '#64748b'
                    }}>
                      {agent.status || 'offline'}
                    </span>
                  </div>
                  <div style={styles.agentStats}>
                    <div style={styles.agentStat}>
                      <span style={styles.agentStatValue}>{agent.currentChatCount || 0}</span>
                      <span style={styles.agentStatLabel}>Active</span>
                    </div>
                    <div style={styles.agentStat}>
                      <span style={styles.agentStatValue}>{agent.maxConcurrentChats || 5}</span>
                      <span style={styles.agentStatLabel}>Max</span>
                    </div>
                    <div style={styles.agentStat}>
                      <span style={styles.agentStatValue}>
                        {(agent.stats && agent.stats.totalChatsHandled) || 0}
                      </span>
                      <span style={styles.agentStatLabel}>Total</span>
                    </div>
                  </div>
                  <div style={styles.agentFooter}>
                    <span style={styles.roleBadge}>{agent.role}</span>
                    <button onClick={() => handleDeleteAgent(agent._id)} style={styles.deleteBtn}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div style={styles.listContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Agent</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Active Chats</th>
                  <th style={styles.th}>Total Handled</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => {
                  const agentEmail = agent.email || agent.user?.email || 'No email';
                  const isOnline = agent.status === 'online' || agent.status === 'busy';
                  return (
                    <tr key={agent._id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={styles.miniAvatar}>
                            {agent.name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          {agent.name}
                        </div>
                      </td>
                      <td style={styles.td}>{agentEmail}</td>
                      <td style={styles.td}>
                        <span style={styles.roleBadge}>{agent.role}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: isOnline ? '#dcfce7' : '#f1f5f9',
                          color: isOnline ? '#16a34a' : '#64748b'
                        }}>
                          {agent.status || 'offline'}
                        </span>
                      </td>
                      <td style={styles.td}>{agent.currentChatCount || 0}</td>
                      <td style={styles.td}>
                        {(agent.stats && agent.stats.totalChatsHandled) || 0}
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => handleDeleteAgent(agent._id)} style={styles.deleteBtn}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Agent Modal */}
      {showInviteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {inviteLink ? 'Invite Sent!' : 'Invite Team Member'}
            </h3>
            
            {inviteLink ? (
              <div style={styles.inviteSuccess}>
                <p style={styles.successText}>
                  Invite created! Send to team member via:
                </p>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number (with country code)</label>
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    style={styles.input}
                    placeholder="923001234567"
                  />
                </div>
                
                <div style={styles.whatsappButtons}>
                  <button 
                    onClick={sendViaWhatsApp} 
                    style={styles.whatsappBtn}
                    disabled={!invitePhone}
                  >
                    <span style={styles.whatsappIcon}>📱</span>
                    Send via WhatsApp
                  </button>
                  <button onClick={copyInviteLink} style={styles.copyBtn}>
                    Copy Link
                  </button>
                </div>
                
                <div style={styles.linkPreview}>
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    style={styles.linkInput}
                  />
                </div>
                
                <p style={styles.linkNote}>
                  Link expires in 7 days. Agent will be added after registration.
                </p>
                
                <div style={styles.modalActions}>
                  <button onClick={() => { setShowInviteModal(false); setInviteLink(null); setInvitePhone(''); setPendingInvite(null); }} style={styles.submitBtn}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    style={styles.input}
                    placeholder="agent@example.com"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number (with country code)</label>
                  <input
                    type="tel"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    style={styles.input}
                    placeholder="923001234567"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={styles.input}
                  >
                    <option value="agent">Agent - Can handle conversations</option>
                    <option value="supervisor">Supervisor - Can manage team</option>
                  </select>
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setShowInviteModal(false)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitBtn}>
                    Create Invite
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' },
  subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
  addBtn: { padding: '12px 24px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statValue: { fontSize: '32px', fontWeight: '700', color: '#0f172a', display: 'block' },
  statLabel: { fontSize: '13px', color: '#64748b' },
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '16px' },
  invitesList: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  inviteItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f1f5f9' },
  inviteInfo: { flex: 1 },
  inviteRole: { marginLeft: '8px', padding: '2px 8px', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '4px', fontSize: '11px', textTransform: 'capitalize' },
  inviteTime: { fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' },
  inviteActions: { display: 'flex', gap: '8px' },
  resendBtn: { padding: '6px 12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  cancelBtnSmall: { padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  inviteSuccess: { textAlign: 'center' },
  successText: { fontSize: '14px', color: '#64748b', marginBottom: '16px' },
  linkContainer: { display: 'flex', gap: '8px', marginBottom: '12px' },
  linkInput: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', backgroundColor: '#f8fafc', boxSizing: 'border-box' },
  linkPreview: { marginBottom: '12px' },
  copyBtn: { padding: '10px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' },
  whatsAppButtons: { display: 'flex', gap: '8px', marginBottom: '12px' },
  whatsAppBtn: { flex: 1, padding: '12px 16px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  whatsAppIcon: { fontSize: '18px' },
  linkNote: { fontSize: '12px', color: '#94a3b8', marginBottom: '16px' },
  handoffList: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  handoffItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f1f5f9' },
  handoffReason: { fontSize: '13px', color: '#64748b', margin: '4px 0' },
  handoffTime: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  acceptBtn: { padding: '8px 16px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', textDecoration: 'none', fontSize: '13px', fontWeight: 500 },
  agentsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' },
  agentCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  agentHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  agentAvatar: { width: '48px', height: '48px', backgroundColor: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '18px' },
  agentInfo: { flex: 1 },
  agentName: { margin: '0 0 2px 0', fontSize: '16px', fontWeight: '600' },
  agentEmail: { fontSize: '13px', color: '#64748b' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  agentStats: { display: 'flex', gap: '16px', marginBottom: '12px' },
  agentStat: { textAlign: 'center', flex: 1 },
  agentStatValue: { display: 'block', fontSize: '20px', fontWeight: '600', color: '#0f172a' },
  agentStatLabel: { fontSize: '11px', color: '#64748b' },
  agentRole: { borderTop: '1px solid #f1f5f9', paddingTop: '12px' },
  agentFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' },
  roleBadge: { padding: '4px 12px', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '4px', fontSize: '12px', fontWeight: '500', textTransform: 'capitalize' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%' },
  modalTitle: { margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' },
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  submitBtn: { padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  // List view styles
  listContainer: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#f8fafc', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #f1f5f9' },
  tr: { transition: 'background-color 0.2s' },
  miniAvatar: { width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '12px' }
};

export default TeamManagement;
