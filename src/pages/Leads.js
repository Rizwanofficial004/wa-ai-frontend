import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import ViewToggle from '../components/ViewToggle';

const Leads = () => {
  const { businessId } = useParams();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('card'); // 'list' or 'card'
  const [stats, setStats] = useState({ total: 0, new: 0, contacted: 0, qualified: 0, converted: 0 });

  useEffect(() => {
    fetchLeads();
  }, [businessId, filter]);

  const fetchLeads = async () => {
    try {
      const url = filter === 'all'
        ? `/businesses/${businessId}/leads`
        : `/businesses/${businessId}/leads?status=${filter}`;
      const res = await api.get(url);
      setLeads(res.data.data);
      
      // Calculate stats from all leads
      const allRes = await api.get(`/businesses/${businessId}/leads`);
      const allLeads = allRes.data.data;
      setStats({
        total: allLeads.length,
        new: allLeads.filter(l => l.status === 'new').length,
        contacted: allLeads.filter(l => l.status === 'contacted').length,
        qualified: allLeads.filter(l => l.status === 'qualified').length,
        converted: allLeads.filter(l => l.status === 'converted').length
      });
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (leadId, status) => {
    try {
      await api.put(`/businesses/${businessId}/leads/${leadId}/status`, { status });
      toast.success('Status updated!');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const addNote = async (leadId, note) => {
    if (!note.trim()) return;
    try {
      await api.post(`/businesses/${businessId}/leads/${leadId}/notes`, { content: note });
      toast.success('Note added!');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const deleteLead = async (leadId) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await api.delete(`/businesses/${businessId}/leads/${leadId}`);
      toast.success('Lead deleted!');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const statusOptions = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  const statusColors = {
    new: { bg: '#dbeafe', text: '#1d4ed8', icon: '🆕' },
    contacted: { bg: '#fef3c7', text: '#b45309', icon: '📞' },
    qualified: { bg: '#d1fae5', text: '#047857', icon: '✅' },
    converted: { bg: '#c7d2fe', text: '#5b21b6', icon: '💰' },
    lost: { bg: '#fee2e2', text: '#b91c1c', icon: '❌' }
  };

  if (loading) {
    return <div style={styles.loading}>Loading leads...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <Link to={`/businesses/${businessId}`} style={styles.backLink}>← Back to Business</Link>
          <h1 style={styles.title}>Leads</h1>
          <p style={styles.subtitle}>Auto-collected from WhatsApp conversations</p>
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard} onClick={() => setFilter('all')}>
          <span style={styles.statNumber}>{stats.total}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #3b82f6'}} onClick={() => setFilter('new')}>
          <span style={styles.statNumber}>{stats.new}</span>
          <span style={styles.statLabel}>New</span>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #f59e0b'}} onClick={() => setFilter('contacted')}>
          <span style={styles.statNumber}>{stats.contacted}</span>
          <span style={styles.statLabel}>Contacted</span>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #10b981'}} onClick={() => setFilter('qualified')}>
          <span style={styles.statNumber}>{stats.qualified}</span>
          <span style={styles.statLabel}>Qualified</span>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #8b5cf6'}} onClick={() => setFilter('converted')}>
          <span style={styles.statNumber}>{stats.converted}</span>
          <span style={styles.statLabel}>Converted</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filters}>
        <button onClick={() => setFilter('all')} style={{...styles.filterBtn, ...(filter === 'all' && styles.filterActive)}}>
          All
        </button>
        {statusOptions.map(status => (
          <button key={status} onClick={() => setFilter(status)} style={{...styles.filterBtn, ...(filter === status && styles.filterActive)}}>
            {statusColors[status].icon} {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Leads List */}
      {leads.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>👤</div>
          <h3 style={styles.emptyTitle}>No leads yet</h3>
          <p style={styles.emptyText}>Leads will be automatically collected when customers show interest in your products</p>
        </div>
      ) : view === 'card' ? (
        <div style={styles.leadsList}>
          {leads.map((lead) => (
            <LeadCard 
              key={lead._id} 
              lead={lead} 
              statusColors={statusColors}
              statusOptions={statusOptions}
              onUpdateStatus={updateStatus}
              onAddNote={addNote}
              onDelete={deleteLead}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div style={styles.listContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Interest</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Source</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const statusStyle = statusColors[lead.status] || statusColors.new;
                return (
                  <tr key={lead._id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={styles.miniAvatar}>
                          {(lead.customerName || lead.customerPhone)[0].toUpperCase()}
                        </div>
                        {lead.customerName || 'Unknown'}
                      </div>
                    </td>
                    <td style={styles.td}>{lead.customerPhone}</td>
                    <td style={styles.td}>
                      <span style={styles.interestPreview}>
                        {lead.interest?.substring(0, 40)}{lead.interest?.length > 40 ? '...' : ''}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <select
                        value={lead.status}
                        onChange={(e) => updateStatus(lead._id, e.target.value)}
                        style={{...styles.statusSelect, backgroundColor: statusStyle.bg, color: statusStyle.text}}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.source}>{lead.source || 'whatsapp'}</span>
                    </td>
                    <td style={styles.td}>{new Date(lead.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button onClick={() => deleteLead(lead._id)} style={styles.deleteBtn}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Lead Card Component
const LeadCard = ({ lead, statusColors, statusOptions, onUpdateStatus, onAddNote, onDelete }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [expanded, setExpanded] = useState(false);
  
  const statusStyle = statusColors[lead.status] || statusColors.new;
  
  const handleAddNote = () => {
    onAddNote(lead._id, noteText);
    setNoteText('');
    setShowNoteInput(false);
  };

  return (
    <div style={styles.leadCard}>
      <div style={styles.leadHeader}>
        <div style={styles.leadAvatar}>
          {(lead.customerName || lead.customerPhone)[0].toUpperCase()}
        </div>
        <div style={styles.leadInfo}>
          <h3 style={styles.leadName}>{lead.customerName || 'Unknown'}</h3>
          <p style={styles.leadPhone}>{lead.customerPhone}</p>
        </div>
        <div style={styles.leadActions}>
          <select
            value={lead.status}
            onChange={(e) => onUpdateStatus(lead._id, e.target.value)}
            style={{...styles.statusSelect, backgroundColor: statusStyle.bg, color: statusStyle.text}}
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {lead.interest && (
        <div style={styles.interestSection}>
          <span style={styles.interestLabel}>💡 Interest:</span>
          <p style={styles.interestText}>{lead.interest}</p>
        </div>
      )}

      {expanded && (
        <div style={styles.expandedSection}>
          {lead.notes?.length > 0 && (
            <div style={styles.notesSection}>
              <span style={styles.notesLabel}>📝 Notes:</span>
              {lead.notes.map((note, i) => (
                <div key={i} style={styles.noteItem}>
                  <span style={styles.noteText}>{note.content}</span>
                  <span style={styles.noteDate}>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}

          {showNoteInput ? (
            <div style={styles.noteInputSection}>
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                style={styles.noteInput}
                onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button onClick={handleAddNote} style={styles.noteSubmitBtn}>Add</button>
              <button onClick={() => setShowNoteInput(false)} style={styles.noteCancelBtn}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowNoteInput(true)} style={styles.addNoteBtn}>+ Add Note</button>
          )}
        </div>
      )}

      <div style={styles.leadFooter}>
        <div style={styles.footerLeft}>
          <span style={styles.source}>{lead.source || 'whatsapp'}</span>
          <span style={styles.date}>{new Date(lead.createdAt).toLocaleDateString()}</span>
        </div>
        <div style={styles.footerRight}>
          <button onClick={() => setExpanded(!expanded)} style={styles.expandBtn}>
            {expanded ? 'Less' : 'More'}
          </button>
          <button onClick={() => onDelete(lead._id)} style={styles.deleteBtn}>Delete</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#64748b' },
  header: { marginBottom: '24px' },
  backLink: { color: '#64748b', textDecoration: 'none', fontSize: '14px', marginBottom: '8px', display: 'inline-block' },
  title: { fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' },
  subtitle: { color: '#64748b', fontSize: '14px', margin: 0 },
  
  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' },
  statNumber: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: '12px', color: '#64748b' },
  
  // Filters
  filters: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  filterBtn: { padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' },
  filterActive: { backgroundColor: '#2563eb', color: '#fff' },
  
  // Empty State
  emptyState: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyTitle: { fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' },
  emptyText: { color: '#64748b' },
  
  // Leads List
  leadsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  leadCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  leadHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  leadAvatar: { width: '48px', height: '48px', backgroundColor: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '18px' },
  leadInfo: { flex: 1 },
  leadName: { fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 2px 0' },
  leadPhone: { fontSize: '13px', color: '#64748b', margin: 0 },
  leadActions: { display: 'flex', gap: '8px' },
  statusSelect: { padding: '6px 12px', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', outline: 'none' },
  
  // Interest
  interestSection: { padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '12px' },
  interestLabel: { fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  interestText: { fontSize: '14px', color: '#1e293b', marginTop: '4px', lineHeight: '1.4' },
  
  // Expanded Section
  expandedSection: { padding: '12px 0', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', marginBottom: '12px' },
  notesSection: { marginBottom: '12px' },
  notesLabel: { fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  noteItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', marginTop: '8px' },
  noteText: { fontSize: '13px', color: '#1e293b' },
  noteDate: { fontSize: '11px', color: '#94a3b8' },
  
  // Note Input
  noteInputSection: { display: 'flex', gap: '8px', marginTop: '8px' },
  noteInput: { flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' },
  noteSubmitBtn: { padding: '10px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  noteCancelBtn: { padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  addNoteBtn: { padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  
  // Footer
  leadFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerLeft: { display: 'flex', gap: '12px', alignItems: 'center' },
  footerRight: { display: 'flex', gap: '8px' },
  source: { padding: '4px 10px', backgroundColor: '#e0f2fe', color: '#0284c7', borderRadius: '20px', fontSize: '11px' },
  date: { fontSize: '12px', color: '#94a3b8' },
  expandBtn: { padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  deleteBtn: { padding: '6px 12px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' },
  // List view styles
  listContainer: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#f8fafc', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #f1f5f9' },
  tr: { transition: 'background-color 0.2s' },
  miniAvatar: { width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '12px' },
  interestPreview: { fontSize: '13px', color: '#64748b' }
};

export default Leads;