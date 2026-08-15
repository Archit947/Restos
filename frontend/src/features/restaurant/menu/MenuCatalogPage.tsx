import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rMenuApi } from '../../../api/restaurantAdmin';
import RestaurantHeader from '../../../components/restaurant-layout/RestaurantHeader';
import { imageUrl } from '../../../utils/imageUrl';

// ─────────────────────────── tiny helpers ────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${color}`}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant = 'ghost', disabled, className = '', type = 'button' }: any) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50';
  const v: Record<string, string> = {
    ghost:   'text-gray-600 hover:bg-gray-100',
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    danger:  'text-red-600 hover:bg-red-50',
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${v[variant]} ${className}`}>{children}</button>;
}

// ─────────────────────────── Category modal ───────────────────────────────────

interface Category { id: number; name: string; description?: string; sort_order: number; is_active: boolean; item_count: number; }
interface MenuItem { id: number; item_number?: number; category_id?: number; name: string; description?: string; price: number; currency: string; is_veg: boolean; spiciness_level: number; is_available: boolean; is_featured: boolean; sort_order: number; tags?: string; category_name?: string; image?: string; image_url?: string; }

function CategoryModal({ cat, onClose, onSave }: { cat: Category | null; onClose: () => void; onSave: (d: any) => void }) {
  const [name, setName] = useState(cat?.name || '');
  const [desc, setDesc] = useState(cat?.description || '');
  const [order, setOrder] = useState(cat?.sort_order ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-5">{cat ? 'Edit Category' : 'New Category'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full input" placeholder="e.g. Starters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="w-full input resize-none" placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input type="number" value={order} onChange={(e) => setOrder(+e.target.value)} className="w-full input" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => onSave({ name, description: desc, sort_order: order })}>
            {cat ? 'Save Changes' : 'Create Category'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Item modal ───────────────────────────────────────

function ItemModal({ item, categories, onClose, onSave }: { item: MenuItem | null; categories: Category[]; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category_id: item?.category_id || '',
    price: item?.price ?? 0,
    currency: item?.currency || 'INR',
    is_veg: item?.is_veg ?? true,
    spiciness_level: item?.spiciness_level ?? 0,
    is_available: item?.is_available ?? true,
    is_featured: item?.is_featured ?? false,
    sort_order: item?.sort_order ?? 0,
    tags: item?.tags || '',
    image: item?.image || item?.image_url || '',
  });

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await rMenuApi.uploadImage(fd);
      if (res.data.success && res.data.data?.url) {
        set('image', res.data.data.url);
      }
    } catch (err) {
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-5">{item ? 'Edit Item' : 'New Menu Item'}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full input" placeholder="e.g. Paneer Butter Masala" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className="w-full input resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className="w-full input">
                <option value="">— Uncategorised —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <div className="flex">
                <select value={form.currency} onChange={(e) => set('currency', e.target.value)} className="input rounded-r-none w-20 border-r-0">
                  {['INR', 'USD', 'EUR', 'GBP'].map((c) => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={form.price} onChange={(e) => set('price', +e.target.value)} className="input rounded-l-none flex-1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <div className="flex gap-3">
                {[true, false].map((v) => (
                  <label key={String(v)} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={form.is_veg === v} onChange={() => set('is_veg', v)} className="accent-emerald-600" />
                    <span className="text-sm">{v ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spice Level</label>
              <select value={form.spiciness_level} onChange={(e) => set('spiciness_level', +e.target.value)} className="w-full input">
                <option value={0}>🌿 Mild</option>
                <option value={1}>🌶 Medium</option>
                <option value={2}>🌶🌶 Hot</option>
                <option value={3}>🌶🌶🌶 Extra Hot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input value={form.tags} onChange={(e) => set('tags', e.target.value)} className="w-full input" placeholder="bestseller, new, seasonal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
              <div className="flex items-center gap-3">
                {form.image && (
                  <img src={imageUrl(form.image)!} alt="Item" className="w-12 h-12 object-cover rounded shadow-sm" />
                )}
                <Btn onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Btn>
                {form.image && (
                  <Btn variant="danger" onClick={() => set('image', '')}>Remove</Btn>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', +e.target.value)} className="w-full input" />
            </div>
          </div>
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_available} onChange={(e) => set('is_available', e.target.checked)} className="accent-emerald-600" />
              <span className="text-sm text-gray-700">Available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="accent-emerald-600" />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => {
            const submitData = {
              ...form,
              categoryId: form.category_id,
              basePrice: form.price,
              isVeg: form.is_veg,
              spicinessLevel: form.spiciness_level,
              isAvailable: form.is_available,
              sortOrder: form.sort_order,
            };
            onSave(submitData);
          }}>
            {item ? 'Save Changes' : 'Add Item'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────── Main page ───────────────────────────────────────

export default function MenuCatalogPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'categories' | 'items'>('items');
  const [catModal, setCatModal] = useState<{ open: boolean; cat: Category | null }>({ open: false, cat: null });
  const [itemModal, setItemModal] = useState<{ open: boolean; item: MenuItem | null }>({ open: false, item: null });
  const [selectedCat, setSelectedCat] = useState<number | undefined>();

  const { data: cats = [] } = useQuery<Category[]>({
    queryKey: ['r-categories'],
    queryFn: () => rMenuApi.getCategories().then((r) => r.data.data),
  });
  const { data: items = [] } = useQuery<MenuItem[]>({
    queryKey: ['r-items', selectedCat],
    queryFn: () => rMenuApi.getItems(selectedCat ? { category_id: selectedCat } : undefined).then((r) => r.data.data),
  });

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['r-categories'] }); qc.invalidateQueries({ queryKey: ['r-items'] }); };

  const saveCat = useMutation({
    mutationFn: (d: any) => catModal.cat ? rMenuApi.updateCategory(catModal.cat!.id, d) : rMenuApi.createCategory(d),
    onSuccess: () => { invalidate(); setCatModal({ open: false, cat: null }); },
  });
  const deleteCat = useMutation({
    mutationFn: (id: number) => rMenuApi.deleteCategory(id),
    onSuccess: invalidate,
  });

  const saveItem = useMutation({
    mutationFn: (d: any) => itemModal.item ? rMenuApi.updateItem(itemModal.item!.id, d) : rMenuApi.createItem(d),
    onSuccess: () => { invalidate(); setItemModal({ open: false, item: null }); },
  });
  const toggleItem = useMutation({
    mutationFn: (id: number) => rMenuApi.toggleItem(id),
    onSuccess: invalidate,
  });
  const deleteItem = useMutation({
    mutationFn: (id: number) => rMenuApi.deleteItem(id),
    onSuccess: invalidate,
  });

  return (
    <div className="flex flex-col h-full">
      <RestaurantHeader
        title="Menu Catalog"
        subtitle="Manage categories and menu items"
        actions={
          <div className="flex gap-2">
            {tab === 'categories' && (
              <Btn variant="primary" onClick={() => setCatModal({ open: true, cat: null })}>
                + Category
              </Btn>
            )}
            {tab === 'items' && (
              <Btn variant="primary" onClick={() => setItemModal({ open: true, item: null })}>
                + Item
              </Btn>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-6">
        <div className="flex gap-6">
          {(['items', 'categories'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'items' ? 'Menu Items' : 'Categories'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* ── ITEMS ── */}
        {tab === 'items' && (
          <>
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={() => setSelectedCat(undefined)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${!selectedCat ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              {cats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCat(c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${selectedCat === c.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {c.name} ({c.item_count})
                </button>
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-2">🍽</div>
                <p className="font-medium">No items yet</p>
                <p className="text-sm">Click "+ Item" to add your first menu item.</p>
              </div>
            )}

            <div className="grid gap-3">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-sm">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center text-xl">
                    {imageUrl(item.image || item.image_url) ? (
                      <img src={imageUrl(item.image || item.image_url)!} alt={item.name} className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      item.is_veg ? '🥗' : '🍗'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.item_number != null && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-500 text-[11px] font-mono font-bold shrink-0" title="Item Number">
                          #{item.item_number}
                        </span>
                      )}
                      <span className="font-semibold text-gray-800">{item.name}</span>
                      {item.is_veg
                        ? <span title="Veg" className="text-emerald-600 text-xs">🟢</span>
                        : <span title="Non-veg" className="text-red-500 text-xs">🔴</span>}
                      {item.is_featured && <Badge color="bg-amber-50 text-amber-700">Featured</Badge>}
                      {item.category_name && <Badge color="bg-gray-50 text-gray-500">{item.category_name}</Badge>}
                    </div>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-800">{item.currency} {Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleItem.mutate(item.id)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${item.is_available ? 'bg-emerald-500' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.is_available ? 'translate-x-5' : ''}`} />
                    </button>
                    <Btn onClick={() => setItemModal({ open: true, item })}>✏️</Btn>
                    <Btn variant="danger" onClick={() => { if (confirm('Delete this item?')) deleteItem.mutate(item.id); }}>🗑</Btn>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── CATEGORIES ── */}
        {tab === 'categories' && (
          <>
            {cats.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-2">🗂</div>
                <p className="font-medium">No categories yet</p>
                <p className="text-sm">Click "+ Category" to add your first category.</p>
              </div>
            )}
            <div className="grid gap-3">
              {cats.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{c.name}</span>
                      <Badge color="bg-blue-50 text-blue-600">{c.item_count} items</Badge>
                      {!c.is_active && <Badge color="bg-gray-100 text-gray-400">Inactive</Badge>}
                    </div>
                    {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Btn onClick={() => setCatModal({ open: true, cat: c })}>✏️</Btn>
                    <Btn variant="danger" onClick={() => { if (confirm(`Delete "${c.name}"? Items will be uncategorised.`)) deleteCat.mutate(c.id); }}>🗑</Btn>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {catModal.open && (
        <CategoryModal
          cat={catModal.cat}
          onClose={() => setCatModal({ open: false, cat: null })}
          onSave={(d) => saveCat.mutate(d)}
        />
      )}
      {itemModal.open && (
        <ItemModal
          item={itemModal.item}
          categories={cats}
          onClose={() => setItemModal({ open: false, item: null })}
          onSave={(d) => saveItem.mutate(d)}
        />
      )}
    </div>
  );
}
