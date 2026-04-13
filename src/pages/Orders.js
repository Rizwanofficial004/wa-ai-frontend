import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import ViewToggle from '../components/ViewToggle';

const Orders = () => {
  const { businessId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('card'); // 'list' or 'card'
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, processing: 0, delivered: 0, revenue: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [businessId, filter]);

  const fetchOrders = async () => {
    try {
      const url = filter === 'all' 
        ? `/businesses/${businessId}/orders`
        : `/businesses/${businessId}/orders?status=${filter}`;
      const res = await api.get(url);
      setOrders(res.data.data);
      
      // Get stats
      const statsRes = await api.get(`/businesses/${businessId}/orders/stats`);
      setStats(statsRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/businesses/${businessId}/orders/${orderId}/status`, { status });
      toast.success('Order status updated!');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const updateOrder = async (orderId, data) => {
    try {
      await api.put(`/businesses/${businessId}/orders/${orderId}`, data);
      toast.success('Order updated!');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await api.delete(`/businesses/${businessId}/orders/${orderId}`);
      toast.success('Order deleted!');
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const statusColors = {
    pending: { bg: '#fef3c7', text: '#b45309', icon: '⏳' },
    confirmed: { bg: '#dbeafe', text: '#1d4ed8', icon: '✓' },
    processing: { bg: '#e0e7ff', text: '#4338ca', icon: '⚙️' },
    shipped: { bg: '#cffafe', text: '#0891b2', icon: '🚚' },
    delivered: { bg: '#d1fae5', text: '#047857', icon: '✅' },
    cancelled: { bg: '#fee2e2', text: '#b91c1c', icon: '❌' }
  };

  if (loading) {
    return <div style={styles.loading}>Loading orders...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <Link to={`/businesses/${businessId}`} style={styles.backLink}>← Back to Business</Link>
          <h1 style={styles.title}>Orders</h1>
          <p style={styles.subtitle}>Auto-created from WhatsApp conversations</p>
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard} onClick={() => setFilter('all')}>
          <span style={styles.statNumber}>{stats.total || 0}</span>
          <span style={styles.statLabel}>Total Orders</span>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #f59e0b'}} onClick={() => setFilter('pending')}>
          <span style={styles.statNumber}>{stats.byStatus?.pending || 0}</span>
          <span style={styles.statLabel}>Pending</span>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #3b82f6'}} onClick={() => setFilter('processing')}>
          <span style={styles.statNumber}>{stats.byStatus?.processing || 0}</span>
          <span style={styles.statLabel}>Processing</span>
        </div>
        <div style={{...styles.statCard, borderLeft: '4px solid #10b981'}} onClick={() => setFilter('delivered')}>
          <span style={styles.statNumber}>{stats.byStatus?.delivered || 0}</span>
          <span style={styles.statLabel}>Delivered</span>
        </div>
        <div style={styles.statCard}>
          <span style={{...styles.statNumber, color: '#059669'}}>PKR {(stats.totalRevenue || 0).toLocaleString()}</span>
          <span style={styles.statLabel}>Revenue</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={styles.filters}>
        <button onClick={() => setFilter('all')} style={{...styles.filterBtn, ...(filter === 'all' && styles.filterActive)}}>
          All
        </button>
        {statusOptions.slice(0, 5).map(status => (
          <button key={status} onClick={() => setFilter(status)} style={{...styles.filterBtn, ...(filter === status && styles.filterActive)}}>
            {statusColors[status].icon} {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>No orders yet</h3>
          <p style={styles.emptyText}>Orders will be automatically created when customers want to buy something</p>
        </div>
      ) : view === 'card' ? (
        <div style={styles.ordersList}>
          {orders.map((order) => (
            <OrderCard 
              key={order._id} 
              order={order} 
              statusColors={statusColors}
              statusOptions={statusOptions}
              onUpdateStatus={updateStatus}
              onViewDetails={() => setSelectedOrder(order)}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div style={styles.listContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Items</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusStyle = statusColors[order.status] || statusColors.pending;
                const orderId = order._id.slice(-6).toUpperCase();
                return (
                  <tr key={order._id} style={styles.tr}>
                    <td style={styles.td}>#{orderId}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={styles.miniAvatar}>
                          {(order.customerName || order.customerPhone)[0].toUpperCase()}
                        </div>
                        <div>
                          <div>{order.customerName || 'Unknown'}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{order.customerPhone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {order.items?.length || 0} item(s)
                    </td>
                    <td style={styles.td}>PKR {(order.totalAmount || 0).toLocaleString()}</td>
                    <td style={styles.td}>
                      <span style={{...styles.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.text}}>
                        {statusStyle.icon} {order.status}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button onClick={() => setSelectedOrder(order)} style={styles.viewBtn}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder}
          statusColors={statusColors}
          statusOptions={statusOptions}
          onUpdateStatus={updateStatus}
          onUpdateOrder={updateOrder}
          onDelete={deleteOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, statusColors, statusOptions, onUpdateStatus, onViewDetails }) => {
  const statusStyle = statusColors[order.status] || statusColors.pending;
  
  return (
    <div style={styles.orderCard}>
      <div style={styles.orderHeader}>
        <div style={styles.orderId}>
          <span style={styles.orderIdLabel}>Order</span>
          <span style={styles.orderIdValue}>#{order._id.slice(-6).toUpperCase()}</span>
        </div>
        <select
          value={order.status}
          onChange={(e) => onUpdateStatus(order._id, e.target.value)}
          style={{...styles.statusSelect, backgroundColor: statusStyle.bg, color: statusStyle.text}}
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div style={styles.orderBody}>
        <div style={styles.customerInfo}>
          <span style={styles.customerName}>{order.customerName || 'Customer'}</span>
          <span style={styles.customerPhone}>{order.customerPhone}</span>
        </div>
        
        <div style={styles.itemsList}>
          {order.items?.map((item, i) => (
            <div key={i} style={styles.orderItem}>
              <span style={styles.itemName}>{item.productName}</span>
              <span style={styles.itemQty}>x{item.quantity}</span>
              {item.price > 0 && <span style={styles.itemPrice}>PKR {item.price.toLocaleString()}</span>}
            </div>
          ))}
        </div>

        {order.totalAmount > 0 && (
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>Total:</span>
            <span style={styles.totalValue}>PKR {order.totalAmount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div style={styles.orderFooter}>
        <span style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
        <button onClick={onViewDetails} style={styles.viewBtn}>View Details</button>
      </div>
    </div>
  );
};

// Order Detail Modal
const OrderDetailModal = ({ order, statusColors, statusOptions, onUpdateStatus, onUpdateOrder, onDelete, onClose }) => {
  const [items, setItems] = useState(order.items || []);
  const [notes, setNotes] = useState(order.notes || '');
  
  const addItem = () => {
    setItems([...items, { productName: '', quantity: 1, price: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = field === 'quantity' || field === 'price' ? Number(value) : value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSave = () => {
    const totalAmount = calculateTotal();
    onUpdateOrder(order._id, { items, notes, totalAmount });
    onClose();
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Order #{order._id.slice(-6).toUpperCase()}</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.modalBody}>
          {/* Customer Info */}
          <div style={styles.modalSection}>
            <h3 style={styles.sectionTitle}>Customer</h3>
            <p style={styles.customerDetail}>{order.customerName || 'Unknown'}</p>
            <p style={styles.customerDetail}>{order.customerPhone}</p>
          </div>

          {/* Status */}
          <div style={styles.modalSection}>
            <h3 style={styles.sectionTitle}>Status</h3>
            <select
              value={order.status}
              onChange={(e) => onUpdateStatus(order._id, e.target.value)}
              style={styles.modalSelect}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div style={styles.modalSection}>
            <h3 style={styles.sectionTitle}>Items</h3>
            {items.map((item, i) => (
              <div key={i} style={styles.itemRow}>
                <input
                  type="text"
                  value={item.productName}
                  onChange={(e) => updateItem(i, 'productName', e.target.value)}
                  placeholder="Product name"
                  style={styles.itemInput}
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  placeholder="Qty"
                  style={styles.itemQtyInput}
                  min="1"
                />
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateItem(i, 'price', e.target.value)}
                  placeholder="Price"
                  style={styles.itemPriceInput}
                  min="0"
                />
                <button onClick={() => removeItem(i)} style={styles.removeItemBtn}>×</button>
              </div>
            ))}
            <button onClick={addItem} style={styles.addItemBtn}>+ Add Item</button>
          </div>

          {/* Total */}
          <div style={styles.totalSection}>
            <span style={styles.totalLabel}>Total Amount:</span>
            <span style={styles.totalValue}>PKR {calculateTotal().toLocaleString()}</span>
          </div>

          {/* Notes */}
          <div style={styles.modalSection}>
            <h3 style={styles.sectionTitle}>Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              style={styles.notesTextarea}
            />
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button onClick={() => onDelete(order._id)} style={styles.deleteOrderBtn}>Delete Order</button>
          <div style={styles.footerRight}>
            <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button onClick={handleSave} style={styles.saveBtn}>Save Changes</button>
          </div>
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' },
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
  
  // Orders List
  ordersList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  orderCard: { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  orderId: { display: 'flex', flexDirection: 'column' },
  orderIdLabel: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase' },
  orderIdValue: { fontSize: '18px', fontWeight: '700', color: '#1e293b' },
  statusSelect: { padding: '6px 12px', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', outline: 'none' },
  
  orderBody: { marginBottom: '16px' },
  customerInfo: { display: 'flex', flexDirection: 'column', marginBottom: '12px' },
  customerName: { fontSize: '14px', fontWeight: '500', color: '#1e293b' },
  customerPhone: { fontSize: '13px', color: '#64748b' },
  
  itemsList: { backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px' },
  orderItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e5e7eb' },
  itemName: { fontSize: '14px', color: '#1e293b' },
  itemQty: { fontSize: '13px', color: '#64748b', backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '4px' },
  itemPrice: { fontSize: '14px', fontWeight: '600', color: '#059669' },
  
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #e5e7eb' },
  totalLabel: { fontSize: '14px', fontWeight: '600', color: '#1e293b' },
  totalValue: { fontSize: '18px', fontWeight: '700', color: '#059669' },
  
  orderFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #e5e7eb' },
  orderDate: { fontSize: '12px', color: '#94a3b8' },
  viewBtn: { padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  
  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' },
  modalTitle: { fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' },
  modalBody: { padding: '24px' },
  modalSection: { marginBottom: '24px' },
  sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' },
  customerDetail: { fontSize: '14px', color: '#64748b', margin: '4px 0' },
  modalSelect: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  
  itemRow: { display: 'flex', gap: '8px', marginBottom: '8px' },
  itemInput: { flex: 2, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none' },
  itemQtyInput: { width: '60px', padding: '10px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none' },
  itemPriceInput: { width: '100px', padding: '10px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none' },
  removeItemBtn: { width: '36px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '18px' },
  addItemBtn: { padding: '10px 16px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginTop: '8px' },
  
  totalSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', marginBottom: '24px' },
  notesTextarea: { width: '100%', minHeight: '80px', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical' },
  
  modalFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e5e7eb' },
  footerRight: { display: 'flex', gap: '12px' },
  deleteOrderBtn: { padding: '10px 16px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  saveBtn: { padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  // List view styles
  listContainer: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#f8fafc', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #f1f5f9' },
  tr: { transition: 'background-color 0.2s' },
  miniAvatar: { width: '32px', height: '32px', backgroundColor: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '12px' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' },
  viewBtn: { padding: '6px 12px', backgroundColor: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }
};

export default Orders;