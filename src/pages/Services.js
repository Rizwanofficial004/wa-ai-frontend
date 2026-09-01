import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { serviceApi } from '../services/api';

const emptyForm = { name: '', description: '', price: '', currency: 'PKR', category: '', durationMinutes: '' };

const Services = () => {
  const { businessId } = useParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try {
      const res = await serviceApi.getAll(businessId);
      setServices(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [businessId]);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: form.price === '' ? null : Number(form.price),
      durationMinutes: form.durationMinutes === '' ? null : Number(form.durationMinutes)
    };
    try {
      if (editingId) await serviceApi.update(businessId, editingId, payload);
      else await serviceApi.create(businessId, payload);
      toast.success(editingId ? 'Service updated' : 'Service added');
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    await serviceApi.delete(businessId, id);
    load();
  };

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading services...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <Link to={`/businesses/${businessId}`} style={{ color: '#64748b', fontSize: 14 }}>← Back</Link>
      <h1 style={{ margin: '8px 0 8px', fontSize: 24 }}>Services</h1>
      <p style={{ color: '#64748b', marginBottom: 20 }}>
        Structured prices and names the AI uses for questions like “how much?”. Do not put prices only in PDFs.
      </p>
      <form onSubmit={submit} style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, display: 'grid', gap: 8 }}>
        <input placeholder="Name (e.g. Consultation)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={input} />
        <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={input} />
        <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={input} />
        <input placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} style={input} />
        <textarea placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={input} />
        <button type="submit" style={btn}>{editingId ? 'Update service' : 'Add service'}</button>
      </form>
      {services.map((svc) => (
        <div key={svc._id} style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>{svc.name}</strong>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {svc.price != null ? `${svc.currency || 'PKR'} ${svc.price}` : 'No price set'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setEditingId(svc._id); setForm({ name: svc.name, description: svc.description || '', price: svc.price ?? '', currency: svc.currency || 'PKR', category: svc.category || '', durationMinutes: svc.durationMinutes ?? '' }); }} style={btnGhost}>Edit</button>
            <button onClick={() => remove(svc._id)} style={btnGhost}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
};

const input = { padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14 };
const btn = { padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' };
const btnGhost = { padding: '6px 10px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' };

export default Services;
