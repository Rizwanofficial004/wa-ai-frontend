import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api, { conversationApi, agentApi } from '../services/api';
import toast from 'react-hot-toast';

const waitingForHuman = (conv) => conv && (!conv.isBotActive || conv.handoffRequested);

const senderLabel = (sender) => {
  if (sender === 'customer') return 'Customer';
  if (sender === 'agent') return 'You';
  return 'AI';
};

const Conversations = () => {
  const { businessId } = useParams();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const selectedIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  selectedIdRef.current = selectedConversation?._id || null;

  useEffect(() => {
    fetchConversations();
  }, [businessId]);

  useEffect(() => {
    const openId = searchParams.get('open');
    if (!openId || conversations.length === 0) return;
    const match = conversations.find((conv) => conv._id === openId);
    if (match && selectedIdRef.current !== openId) {
      selectConversation(match);
    }
  }, [conversations, searchParams]);

  useEffect(() => {
    if (!selectedConversation?._id) return undefined;
    const timer = setInterval(() => {
      refreshOpenConversation(selectedConversation._id);
      fetchConversations(true);
    }, 6000);
    return () => clearInterval(timer);
  }, [selectedConversation?._id, businessId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async (silent = false) => {
    try {
      const res = await api.get(`/businesses/${businessId}/conversations`);
      const list = res.data.data || [];
      list.sort((a, b) => Number(waitingForHuman(b)) - Number(waitingForHuman(a)));
      setConversations(list);
      setSelectedConversation((prev) => {
        if (!prev) return prev;
        const fresh = list.find((conv) => conv._id === prev._id);
        return fresh ? { ...prev, ...fresh } : prev;
      });
    } catch (error) {
      if (!silent) toast.error('Failed to fetch conversations');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const refreshOpenConversation = async (conversationId) => {
    try {
      const res = await api.get(`/businesses/${businessId}/conversations/${conversationId}`);
      if (selectedIdRef.current !== conversationId) return;
      setMessages(res.data.data.messages || []);
      if (res.data.data.conversation) {
        setSelectedConversation((prev) =>
          prev && prev._id === conversationId ? { ...prev, ...res.data.data.conversation } : prev
        );
      }
    } catch (error) {
      // Keep the current view if a background refresh fails.
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setReplyMessage('');
    try {
      const res = await api.get(`/businesses/${businessId}/conversations/${conversation._id}`);
      setMessages(res.data.data.messages || []);
      if (res.data.data.conversation) {
        setSelectedConversation({ ...conversation, ...res.data.data.conversation });
      }
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

  const sendReply = async () => {
    const content = replyMessage.trim();
    if (!content || !selectedConversation || sending) return;

    setSending(true);
    try {
      const res = await conversationApi.sendMessage(businessId, selectedConversation._id, content);
      const data = res.data.data;
      setReplyMessage('');
      if (data?.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      if (data?.conversation) {
        setSelectedConversation((prev) => ({ ...prev, ...data.conversation }));
      }
      toast.success('Sent to customer');
      fetchConversations(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const takeOver = async () => {
    if (!selectedConversation) return;
    try {
      const res = await conversationApi.requestHandoff(businessId, selectedConversation._id, 'manual');
      setSelectedConversation((prev) => ({ ...prev, ...res.data.data }));
      toast.success('AI paused. You can reply to the customer now.');
      fetchConversations(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to take over chat');
    }
  };

  const returnToAi = async () => {
    if (!selectedConversation) return;
    try {
      await agentApi.returnToBot(businessId, selectedConversation._id);
      setSelectedConversation((prev) => ({
        ...prev,
        isBotActive: true,
        handoffRequested: false,
        handoffReason: null
      }));
      toast.success('AI will reply to this customer again');
      fetchConversations(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return chat to AI');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading conversations...</div>;
  }

  const humanNeeded = waitingForHuman(selectedConversation);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <Link to={`/businesses/${businessId}`} style={styles.backLink}>← Back to Business</Link>
          <h1 style={styles.title}>Conversations</h1>
          <p style={styles.subtitle}>
            AI replies first. If it cannot answer, the chat waits here for you.
          </p>
        </div>
      </div>

      <div style={styles.chatContainer}>
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
                <div style={styles.badgeRow}>
                  <span style={{
                    ...styles.convStatus,
                    backgroundColor: conv.status === 'active' ? '#10b981' : conv.status === 'pending' ? '#f59e0b' : '#6b7280'
                  }}>
                    {conv.status}
                  </span>
                  {waitingForHuman(conv) && (
                    <span style={styles.waitingBadge}>Needs you</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

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
                  {humanNeeded ? (
                    <button onClick={returnToAi} style={styles.returnBtn}>
                      Return to AI
                    </button>
                  ) : (
                    <button onClick={takeOver} style={styles.takeOverBtn}>
                      Take over
                    </button>
                  )}
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

              {humanNeeded && (
                <div style={styles.handoffBanner}>
                  AI is paused. Reply below and it will go to the customer on WhatsApp.
                </div>
              )}

              <div style={styles.messagesList}>
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      ...styles.message,
                      ...(msg.sender === 'customer'
                        ? styles.messageCustomer
                        : msg.sender === 'agent'
                          ? styles.messageAgent
                          : styles.messageAI)
                    }}
                  >
                    <div style={styles.messageContent}>{msg.content}</div>
                    <div style={styles.messageMeta}>
                      <span style={styles.messageSender}>{senderLabel(msg.sender)}</span>
                      <span style={styles.messageTime}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={styles.replyArea}>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder={
                    humanNeeded
                      ? 'Type a reply to the customer...'
                      : 'Type to reply as a human (this pauses AI for this chat)'
                  }
                  style={styles.replyInput}
                  rows={2}
                />
                <button
                  style={{
                    ...styles.sendBtn,
                    ...(sending || !replyMessage.trim() ? styles.sendBtnDisabled : {})
                  }}
                  disabled={sending || !replyMessage.trim()}
                  onClick={sendReply}
                >
                  {sending ? 'Sending...' : 'Send'}
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
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '4px'
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
  badgeRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  convStatus: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    color: '#fff'
  },
  waitingBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontWeight: '600'
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
    gap: '8px',
    alignItems: 'center'
  },
  statusSelect: {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none'
  },
  takeOverBtn: {
    padding: '8px 12px',
    backgroundColor: '#fff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  returnBtn: {
    padding: '8px 12px',
    backgroundColor: '#ecfdf5',
    color: '#047857',
    border: '1px solid #a7f3d0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  handoffBanner: {
    padding: '10px 20px',
    backgroundColor: '#fffbeb',
    color: '#92400e',
    fontSize: '13px',
    borderBottom: '1px solid #fde68a'
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
  messageAgent: {
    backgroundColor: '#d1fae5',
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
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  sendBtnDisabled: {
    backgroundColor: '#94a3b8',
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
