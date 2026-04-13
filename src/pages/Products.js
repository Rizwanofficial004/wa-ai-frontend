import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import ViewToggle from '../components/ViewToggle';

const Products = () => {
  const { businessId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('card'); // 'list' or 'card'
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    price: '',
    salePrice: '',
    sizes: '',
    colors: '',
    tags: '',
    images: '',
    stock: '',
    sku: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchBrands();
    fetchCategories();
  }, [businessId]);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}/products`);
      setProducts(res.data.products || []);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}/products/brands`);
      setBrands(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch brands');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}/products/categories`);
      setCategories(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      category: '',
      description: '',
      price: '',
      salePrice: '',
      sizes: '',
      colors: '',
      tags: '',
      images: '',
      stock: '',
      sku: ''
    });
    setEditingProduct(null);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      brand: product.brand || '',
      category: product.category || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      salePrice: product.salePrice?.toString() || '',
      sizes: product.sizes?.map(s => s.size).join(', ') || '',
      colors: product.colors?.map(c => c.name).join(', ') || '',
      tags: product.tags?.join(', ') || '',
      images: product.images?.map(img => img.url).join('\n') || '',
      stock: product.stock?.toString() || '',
      sku: product.sku || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      brand: formData.brand || undefined,
      category: formData.category || undefined,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
      stock: parseInt(formData.stock) || 0,
      sku: formData.sku || undefined,
      sizes: formData.sizes ? formData.sizes.split(',').map(s => ({ size: s.trim(), stock: 0 })) : [],
      colors: formData.colors ? formData.colors.split(',').map(c => ({ name: c.trim(), code: '' })) : [],
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      images: formData.images ? formData.images.split('\n').filter(url => url.trim()).map((url, i) => ({
        url: url.trim(),
        isPrimary: i === 0
      })) : []
    };

    try {
      if (editingProduct) {
        await api.put(`/businesses/${businessId}/products/${editingProduct._id}`, productData);
        toast.success('Product updated!');
      } else {
        await api.post(`/businesses/${businessId}/products`, productData);
        toast.success('Product created!');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
      fetchBrands();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/businesses/${businessId}/products/${productId}`);
      toast.success('Product deleted!');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading products...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <Link to={`/businesses/${businessId}`} style={styles.backLink}>← Back to Business</Link>
          <h1 style={styles.title}>Product Catalog</h1>
          <p style={styles.subtitle}>Manage products for WhatsApp ordering</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ViewToggle view={view} onViewChange={setView} />
          <button onClick={() => { resetForm(); setShowModal(true); }} style={styles.addButton}>
            + Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{products.length}</span>
          <span style={styles.statLabel}>Total Products</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{brands.length}</span>
          <span style={styles.statLabel}>Brands</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{categories.length}</span>
          <span style={styles.statLabel}>Categories</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{products.reduce((sum, p) => sum + (p.stock || 0), 0)}</span>
          <span style={styles.statLabel}>Total Stock</span>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>👟</div>
          <h3 style={styles.emptyTitle}>No products yet</h3>
          <p style={styles.emptyText}>Add products so customers can order via WhatsApp</p>
        </div>
      ) : view === 'card' ? (
        <div style={styles.productsGrid}>
          {products.map((product) => (
            <div key={product._id} style={styles.productCard}>
              <div style={styles.productImage}>
                {product.images?.length > 0 ? (
                  <img src={product.images[0].url} alt={product.name} style={styles.img} />
                ) : (
                  <div style={styles.noImage}>No Image</div>
                )}
              </div>
              <div style={styles.productInfo}>
                <h3 style={styles.productName}>{product.name}</h3>
                {product.brand && <p style={styles.productBrand}>{product.brand}</p>}
                <p style={styles.productPrice}>PKR {product.price?.toLocaleString()}</p>
                <div style={styles.productMeta}>
                  {product.sizes?.length > 0 && (
                    <span style={styles.metaTag}>Sizes: {product.sizes.length}</span>
                  )}
                  {product.colors?.length > 0 && (
                    <span style={styles.metaTag}>Colors: {product.colors.length}</span>
                  )}
                  <span style={styles.metaTag}>Stock: {product.stock || 0}</span>
                </div>
              </div>
              <div style={styles.productActions}>
                <button onClick={() => openEditModal(product)} style={styles.editBtn}>Edit</button>
                <button onClick={() => handleDelete(product._id)} style={styles.deleteBtn}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div style={styles.listContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Sizes</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={styles.miniImage}>
                        {product.images?.length > 0 ? (
                          <img src={product.images[0].url} alt={product.name} style={styles.miniImg} />
                        ) : (
                          <span>📦</span>
                        )}
                      </div>
                      {product.name}
                    </div>
                  </td>
                  <td style={styles.td}>{product.brand || '-'}</td>
                  <td style={styles.td}>{product.category || '-'}</td>
                  <td style={styles.td}>PKR {product.price?.toLocaleString()}</td>
                  <td style={styles.td}>
                    <span style={product.stock > 0 ? styles.inStock : styles.outOfStock}>
                      {product.stock || 0}
                    </span>
                  </td>
                  <td style={styles.td}>{product.sizes?.length || 0}</td>
                  <td style={styles.td}>
                    <button onClick={() => openEditModal(product)} style={styles.editBtn}>Edit</button>
                    <button onClick={() => handleDelete(product._id)} style={styles.deleteBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nike Air Max 90"
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    placeholder="Nike"
                    list="brands"
                    style={styles.input}
                  />
                  <datalist id="brands">
                    {brands.map((brand, i) => <option key={i} value={brand} />)}
                  </datalist>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Shoes"
                    list="categories"
                    style={styles.input}
                  />
                  <datalist id="categories">
                    {categories.map((cat, i) => <option key={i} value={cat} />)}
                  </datalist>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    placeholder="NIKE-AIR90-001"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Price (PKR) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="15000"
                    style={styles.input}
                    required
                    min="0"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Sale Price (PKR)</label>
                  <input
                    type="number"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({...formData, salePrice: e.target.value})}
                    placeholder="12000"
                    style={styles.input}
                    min="0"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    placeholder="100"
                    style={styles.input}
                    min="0"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Sizes (comma separated)</label>
                  <input
                    type="text"
                    value={formData.sizes}
                    onChange={(e) => setFormData({...formData, sizes: e.target.value})}
                    placeholder="40, 41, 42, 43, 44"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Colors (comma separated)</label>
                  <input
                    type="text"
                    value={formData.colors}
                    onChange={(e) => setFormData({...formData, colors: e.target.value})}
                    placeholder="Black, White, Red"
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="running, sports, casual"
                    style={styles.input}
                  />
                </div>

                <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Product description..."
                    style={{...styles.input, minHeight: '60px'}}
                  />
                </div>

                <div style={{...styles.inputGroup, gridColumn: 'span 2'}}>
                  <label style={styles.label}>Image URLs (one per line)</label>
                  <textarea
                    value={formData.images}
                    onChange={(e) => setFormData({...formData, images: e.target.value})}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    style={{...styles.input, minHeight: '80px', fontFamily: 'monospace'}}
                  />
                  <p style={styles.helpText}>Add product image URLs. First image will be the primary image.</p>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>
                  {editingProduct ? 'Update Product' : 'Add Product'}
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
  container: { maxWidth: '1200px', margin: '0 auto' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#64748b' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  backLink: { color: '#64748b', textDecoration: 'none', fontSize: '14px', marginBottom: '8px', display: 'inline-block' },
  title: { fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' },
  subtitle: { color: '#64748b', fontSize: '14px', margin: 0 },
  addButton: { padding: '12px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { backgroundColor: '#fff', borderRadius: '10px', padding: '16px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statNumber: { display: 'block', fontSize: '24px', fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: '12px', color: '#64748b' },
  
  emptyState: { textAlign: 'center', padding: '60px 20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyTitle: { fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' },
  emptyText: { color: '#64748b' },
  
  productsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  productCard: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  productImage: { height: '180px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  noImage: { color: '#94a3b8', fontSize: '14px' },
  productInfo: { padding: '16px' },
  productName: { fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' },
  productBrand: { fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' },
  productPrice: { fontSize: '18px', fontWeight: '700', color: '#059669', margin: '0 0 8px 0' },
  productMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  metaTag: { fontSize: '11px', padding: '4px 8px', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#64748b' },
  productActions: { display: 'flex', gap: '8px', padding: '0 16px 16px' },
  editBtn: { flex: 1, padding: '8px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  deleteBtn: { flex: 1, padding: '8px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' },
  modalTitle: { fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' },
  form: { padding: '24px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#374151' },
  input: { padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  helpText: { fontSize: '11px', color: '#94a3b8', margin: '4px 0 0 0' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  submitBtn: { padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  // List view styles
  listContainer: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', backgroundColor: '#f8fafc', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #f1f5f9' },
  tr: { transition: 'background-color 0.2s' },
  miniImage: { width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  miniImg: { width: '100%', height: '100%', objectFit: 'cover' },
  inStock: { padding: '2px 8px', backgroundColor: '#d1fae5', color: '#047857', borderRadius: '4px', fontSize: '12px' },
  outOfStock: { padding: '2px 8px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '12px' }
};

export default Products;