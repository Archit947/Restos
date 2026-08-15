import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { storeCategoriesApi, storeItemsApi } from '@/api/storeAdmin';

// ─── Category modal ───────────────────────────────────────────────────────────
function CategoryModal({ cat, onClose }: { cat: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(cat?.name || '');
  const [desc, setDesc] = useState(cat?.description || '');

  const mut = useMutation({
    mutationFn: () => cat
      ? storeCategoriesApi.update(cat.id, { name, description: desc })
      : storeCategoriesApi.create({ name, description: desc }),
    onSuccess: () => {
      toast.success(cat ? 'Category updated.' : 'Category created.');
      qc.invalidateQueries({ queryKey: ['store-categories'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed.'),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, fontFamily: 'system-ui' }}>
        <h3 style={{ margin: '0 0 20px', color: '#f1f5f9', fontSize: 17, fontWeight: 700 }}>{cat ? 'Edit Category' : 'New Category'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Category name *"
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none' }} />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)" rows={3}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none', resize: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => mut.mutate()} disabled={!name.trim() || mut.isPending}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: mut.isPending ? 0.7 : 1 }}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Item modal ───────────────────────────────────────────────────────────────
function ItemModal({ item, categories, onClose }: { item: any | null; categories: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name:           item?.name || '',
    description:    item?.description || '',
    price:          item?.price || '',
    category_id:    item?.category_id || '',
    stock_quantity: item?.stock_quantity ?? 0,
    is_available:   item?.is_available ?? 1,
    is_featured:    item?.is_featured ?? 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(item?.image || null);

  const mut = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (imageFile) fd.append('image', imageFile);
      return item ? storeItemsApi.update(item.id, fd) : storeItemsApi.create(fd);
    },
    onSuccess: () => {
      toast.success(item ? 'Item updated.' : 'Item created.');
      qc.invalidateQueries({ queryKey: ['store-items'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed.'),
  });

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: 24 }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, fontFamily: 'system-ui' }}>
        <h3 style={{ margin: '0 0 20px', color: '#f1f5f9', fontSize: 17, fontWeight: 700 }}>{item ? 'Edit Item' : 'New Item'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Item name *"
            style={inputStyle} />
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description" rows={2}
            style={{ ...inputStyle, resize: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input value={form.price} onChange={e => set('price', e.target.value)} placeholder="Price (₹) *" type="number" min="0" step="0.01"
              style={inputStyle} />
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)} style={inputStyle}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} placeholder="Stock qty" type="number" min="0"
              style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
              <input type="checkbox" checked={Boolean(form.is_available)} onChange={e => set('is_available', e.target.checked ? 1 : 0)} /> Available
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
              <input type="checkbox" checked={Boolean(form.is_featured)} onChange={e => set('is_featured', e.target.checked ? 1 : 0)} /> Featured
            </label>
          </div>
          {/* Image upload */}
          <div>
            <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Item Image</label>
            <div style={{ border: '2px dashed #334155', borderRadius: 10, padding: 16, textAlign: 'center', cursor: 'pointer' }}
              onClick={() => document.getElementById('item-img-input')?.click()}>
              {preview
                ? <img src={preview} alt="" style={{ maxHeight: 100, borderRadius: 8, objectFit: 'cover' }} />
                : <span style={{ color: '#64748b', fontSize: 13 }}>Click to upload image</span>
              }
            </div>
            <input id="item-img-input" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setPreview(URL.createObjectURL(f)); } }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          <button onClick={() => mut.mutate()} disabled={!form.name.trim() || !form.price || mut.isPending}
            style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: mut.isPending ? 0.7 : 1 }}>
            {mut.isPending ? 'Saving…' : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#f1f5f9', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' };

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StoreItemsPage() {
  const qc = useQueryClient();
  const [tab,        setTab]        = useState<'items' | 'categories'>('items');
  const [catModal,   setCatModal]   = useState<any>(false);  // false | null(new) | cat(edit)
  const [itemModal,  setItemModal]  = useState<any>(false);
  const [catFilter,  setCatFilter]  = useState('');

  const { data: catsData } = useQuery({ queryKey: ['store-categories'], queryFn: () => storeCategoriesApi.list().then(r => r.data.data || []) });
  const { data: itemsData, isLoading } = useQuery({ queryKey: ['store-items', catFilter], queryFn: () => storeItemsApi.list(catFilter ? { category_id: catFilter } : {}).then(r => r.data.data || []) });

  const categories: any[] = catsData || [];
  const items: any[]      = itemsData || [];

  const deleteCat = useMutation({
    mutationFn: (id: number) => storeCategoriesApi.delete(id),
    onSuccess: () => { toast.success('Category deleted.'); qc.invalidateQueries({ queryKey: ['store-categories'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed.'),
  });

  const deleteItem = useMutation({
    mutationFn: (id: number) => storeItemsApi.delete(id),
    onSuccess: () => { toast.success('Item deleted.'); qc.invalidateQueries({ queryKey: ['store-items'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed.'),
  });

  const toggleAvail = useMutation({
    mutationFn: ({ id, is_available }: { id: number; is_available: number }) => {
      const fd = new FormData(); fd.append('is_available', String(is_available));
      return storeItemsApi.update(id, fd);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-items'] }),
  });

  return (
    <div style={{ padding: 28, color: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Items & Inventory</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Manage your store products</p>
        </div>
        <button
          onClick={() => tab === 'items' ? setItemModal(null) : setCatModal(null)}
          style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + Add {tab === 'items' ? 'Item' : 'Category'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#1e293b', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 20 }}>
        {(['items', 'categories'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'transparent',
              color: tab === t ? '#fff' : '#64748b' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Items tab */}
      {tab === 'items' && (
        <>
          {/* Category filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setCatFilter('')} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${!catFilter ? '#8b5cf6' : '#334155'}`, background: !catFilter ? 'rgba(139,92,246,0.12)' : 'transparent', color: !catFilter ? '#c4b5fd' : '#64748b', fontSize: 12, cursor: 'pointer' }}>All</button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setCatFilter(String(c.id))}
                style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${catFilter === String(c.id) ? '#8b5cf6' : '#334155'}`, background: catFilter === String(c.id) ? 'rgba(139,92,246,0.12)' : 'transparent', color: catFilter === String(c.id) ? '#c4b5fd' : '#64748b', fontSize: 12, cursor: 'pointer' }}>
                {c.name}
              </button>
            ))}
          </div>

          {isLoading ? <p style={{ color: '#64748b' }}>Loading items…</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {items.length === 0 && <p style={{ color: '#64748b', fontSize: 14 }}>No items found. Add your first item!</p>}
              {items.map((item: any) => (
                <div key={item.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
                  {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: 140, objectFit: 'cover' }} />}
                  {!item.image && <div style={{ height: 80, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>}
                  <div style={{ padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                        {item.category_name && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>{item.category_name}</p>}
                      </div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#c4b5fd', flexShrink: 0 }}>₹{item.price}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6,
                        background: item.stock_quantity === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                        color: item.stock_quantity === 0 ? '#fca5a5' : '#6ee7b7' }}>
                        {item.stock_quantity === 0 ? 'Out of stock' : `${item.stock_quantity} in stock`}
                      </span>
                      <button
                        onClick={() => toggleAvail.mutate({ id: item.id, is_available: item.is_available ? 0 : 1 })}
                        style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: item.is_available ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.2)',
                          color: item.is_available ? '#6ee7b7' : '#64748b' }}>
                        {item.is_available ? 'Available' : 'Hidden'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <button onClick={() => setItemModal(item)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                      <button onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteItem.mutate(item.id); }}
                        style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#fca5a5', cursor: 'pointer', fontSize: 12 }}>🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Categories tab */}
      {tab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {categories.length === 0 && <p style={{ color: '#64748b', fontSize: 14 }}>No categories yet. Create your first one!</p>}
          {categories.map((c: any) => (
            <div key={c.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{c.name}</p>
                {c.description && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>{c.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setCatModal(c)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                <button onClick={() => { if (confirm(`Delete "${c.name}"?`)) deleteCat.mutate(c.id); }}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#fca5a5', cursor: 'pointer', fontSize: 12 }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {catModal !== false && <CategoryModal cat={catModal} onClose={() => setCatModal(false)} />}
      {itemModal !== false && <ItemModal item={itemModal} categories={categories} onClose={() => setItemModal(false)} />}
    </div>
  );
}
