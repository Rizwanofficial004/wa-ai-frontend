import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

const Conversations = () => {
  const { businessId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [businessId]);

  const fetchConversations = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}/conversations`);
      setConversations(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      const res = await api.get(`/businesses/${businessId}/conversations/${conversation._id}`);
      setMessages(res.data.data.messages);
    } catch (error) {
      toast.error('Failed to fetch messages');
    }
  };

  const updateStatus = async (status) => {
    try {
      await api.put(`/businesses/${businessId}/conversations/${selectedConversation._id}/status`, { status });
      toast.success('Status updated');
      fetchConversations();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading conversations...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <Link to={`/businesses/${businessId}`} style={styles.backLink}>← Back to Business</Link>
          <h1 style={styles.title}>Conversations</h1>
        </div>
      </div>

      <div style={styles.chatContainer}>
        {/* Conversations List */}
        <div style={styles.sidebar}>
          {conversations.length === 0 ? (
            <div style={styles.emptySidebar}>
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => selectConversation(conv)}
                style={{
                  ...styles.conversationItem,
                  ...(selectedConversation?._id === conv._id && styles.conversationActive)
                }}
              >
                <div style={styles.convHeader}>
                  <span style={styles.convName}>{conv.customerName || conv.customerPhone}</span>
                  <span style={styles.convTime}>
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={styles.convPhone}>{conv.customerPhone}</div>
                <span style={{
                  ...styles.convStatus,
                  backgroundColor: conv.status === 'active' ? '#10b981' : conv.status === 'pending' ? '#f59e0b' : '#6b7280'
                }}>
                  {conv.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Messages Area */}
        <div style={styles.messagesArea}>
          {selectedConversation ? (
            <>
              <div style={styles.messagesHeader}>
                <div>
                  <h3 style={styles.messagesTitle}>
                    {selectedConversation.customerName || selectedConversation.customerPhone}
                  </h3>
                  <p style={styles.messagesSubtitle}>{selectedConversation.customerPhone}</p>
                </div>
                <div style={styles.statusActions}>
                  <select
                    value={selectedConversation.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    style={styles.statusSelect}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div style={styles.messagesList}>
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      ...styles.message,
                      ...(msg.sender === 'customer' ? styles.messageCustomer : styles.messageAI)
                    }}
                  >
                    <div style={styles.messageContent}>{msg.content}</div>
                    <div style={styles.messageMeta}>
                      <span style={styles.messageSender}>
                        {msg.sender === 'customer' ? 'Customer' : 'AI'}
                      </span>
                      <span style={styles.messageTime}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.replyArea}>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type a message... (Note: AI auto-replies are enabled)"
                  style={styles.replyInput}
                  rows={2}
                />
                <button style={styles.sendBtn} disabled>
                  Send (AI Auto-reply Enabled)
                </button>
              </div>
            </>
          ) : (
            <div style={styles.noSelection}>
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: 'calc(100vh - 80px)',
    display: 'flex',
    flexDirection: 'column'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    color: '#64748b'
  },
  header: {
    marginBottom: '20px'
  },
  backLink: {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '14px',
    marginBottom: '8px',
    display: 'inline-block'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b'
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  sidebar: {
    width: '320px',
    borderRight: '1px solid #e5e7eb',
    overflow: 'auto'
  },
  emptySidebar: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#64748b'
  },
  conversationItem: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  conversationActive: {
    backgroundColor: '#eff6ff'
  },
  convHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  convName: {
    fontWeight: '500',
    color: '#1e293b'
  },
  convTime: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  convPhone: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '8px'
  },
  convStatus: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    color: '#fff'
  },
  messagesArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  messagesHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  messagesTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '2px'
  },
  messagesSubtitle: {
    fontSize: '13px',
    color: '#64748b'
  },
  statusActions: {
    display: 'flex',
    gap: '8px'
  },
  statusSelect: {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none'
  },
  messagesList: {
    flex: 1,
    padding: '20px',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  message: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '12px'
  },
  messageCustomer: {
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start'
  },
  messageAI: {
    backgroundColor: '#dbeafe',
    alignSelf: 'flex-end'
  },
  messageContent: {
    fontSize: '14px',
    color: '#1e293b',
    lineHeight: '1.5'
  },
  messageMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
    fontSize: '11px',
    color: '#94a3b8'
  },
  messageSender: {
    fontWeight: '500'
  },
  replyArea: {
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px'
  },
  replyInput: {
    flex: 1,
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'none',
    outline: 'none'
  },
  sendBtn: {
    padding: '12px 24px',
    backgroundColor: '#94a3b8',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'not-allowed'
  },
  noSelection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b'
  }
};

export default Conversations;