import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rCmsApi, rMenuApi } from '../../../../api/restaurantAdmin';
import { imageUrl } from '../../../../utils/imageUrl';

interface Post {
  id: number; title: string; content: string; excerpt?: string;
  featured_image?: string; author?: string; category?: string; tags?: string;
  status: 'draft' | 'published'; published_at?: string;
  views?: number; created_at: string;
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition
        ${active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
      {label}
    </button>
  );
}

// ─── Post modal ───────────────────────────────────────────────────────────────
function PostModal({ post, onClose, onSave, saving }: {
  post: Post | null; onClose: () => void; onSave: (d: any) => void; saving: boolean;
}) {
  const [form, setForm] = useState({
    title:          post?.title || '',
    excerpt:        post?.excerpt || '',
    content:        post?.content || '',
    author:         post?.author || '',
    category:       post?.category || '',
    tags:           post?.tags || '',
    featured_image: post?.featured_image || '',
    status:         post?.status || 'draft' as 'draft' | 'published',
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('image', file);
      const res = await rMenuApi.uploadImage(fd);
      if (res.data.success && res.data.data?.url) set('featured_image', res.data.data.url);
    } catch { alert('Image upload failed.'); }
    finally { setUploading(false); }
  };

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{post ? 'Edit Article' : 'Write New Article'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Featured image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
            <div className="flex items-center gap-3">
              {imageUrl(form.featured_image) && (
                <img src={imageUrl(form.featured_image)!} alt="" className="w-20 h-14 object-cover rounded-lg border border-gray-200" />
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : imageUrl(form.featured_image) ? 'Change Image' : '+ Upload Cover'}
              </button>
              {imageUrl(form.featured_image) && (
                <button onClick={() => set('featured_image', '')} className="text-xs text-red-500 hover:underline">Remove</button>
              )}
              <input type="file" ref={fileRef} onChange={uploadCover} accept="image/*" className="hidden" />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="w-full input text-base font-medium" placeholder="Article title" />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt <span className="text-gray-400 font-normal">(shown on blog list)</span></label>
            <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={2} className="w-full input resize-none" placeholder="Short summary…" />
          </div>

          {/* Content */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Content *</label>
              <span className="text-xs text-gray-400">{wordCount} words · ~{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
            </div>
            <textarea
              value={form.content} onChange={e => set('content', e.target.value)}
              rows={12} className="w-full input resize-y font-mono text-sm leading-relaxed"
              placeholder="Write your article content here… (supports plain text)"
            />
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <input value={form.author} onChange={e => set('author', e.target.value)} className="w-full input" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input value={form.category} onChange={e => set('category', e.target.value)} className="w-full input" placeholder="Food, Events…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} className="w-full input" placeholder="pasta, italian" />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-6 pt-1">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            {(['draft', 'published'] as const).map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.status === s} onChange={() => set('status', s)} className="accent-emerald-600" />
                <span className="text-sm capitalize">{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {form.status === 'published' ? '🌐 Visible on public site' : '🔒 Saved as draft'}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition">Cancel</button>
            <button
              onClick={() => onSave(form)} disabled={saving || !form.title.trim()}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {saving ? 'Saving…' : post ? 'Save Changes' : form.status === 'published' ? 'Publish' : 'Save Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main BlogTab ─────────────────────────────────────────────────────────────
export default function BlogTab() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<{ open: boolean; post: Post | null }>({ open: false, post: null });

  const { data, isLoading } = useQuery({
    queryKey: ['r-blog', statusFilter],
    queryFn: () => rCmsApi.getBlogPosts(statusFilter ? { status: statusFilter } : undefined).then(r => r.data.data),
  });

  const posts: Post[] = data?.posts || [];
  const total: number = data?.total || 0;

  const save = useMutation({
    mutationFn: (d: any) => modal.post ? rCmsApi.updateBlogPost(modal.post!.id, d) : rCmsApi.createBlogPost(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['r-blog'] }); setModal({ open: false, post: null }); },
  });
  const remove = useMutation({
    mutationFn: (id: number) => rCmsApi.deleteBlogPost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['r-blog'] }),
  });

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['', 'published', 'draft'].map(s => (
            <Pill key={s} label={s || 'All'} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
          {total > 0 && <span className="text-xs text-gray-400 self-center ml-1">{total} post{total !== 1 ? 's' : ''}</span>}
        </div>
        <button
          onClick={() => setModal({ open: true, post: null })}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5"
        >
          ✍️ Write Article
        </button>
      </div>

      {isLoading && <div className="text-center text-gray-400 py-14">Loading…</div>}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📝</div>
          <p className="font-semibold text-base">No articles yet</p>
          <p className="text-sm mt-1">Share your stories, recipes, and news with your customers.</p>
          <button onClick={() => setModal({ open: true, post: null })} className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition">Write Your First Article</button>
        </div>
      )}

      {/* Post list */}
      <div className="space-y-3">
        {posts.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden flex">
            {/* Cover thumb */}
            {imageUrl(p.featured_image) && (
              <div className="w-24 flex-shrink-0 bg-gray-50">
                <img src={imageUrl(p.featured_image)!} alt={p.title} className="w-full h-full object-cover" style={{ minHeight: 80 }} />
              </div>
            )}
            <div className="flex-1 min-w-0 px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-semibold text-gray-800 truncate">{p.title}</p>
                  {p.category && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{p.category}</span>}
                </div>
                {p.excerpt && <p className="text-xs text-gray-400 truncate">{p.excerpt}</p>}
                <div className="flex gap-3 mt-1 text-[11px] text-gray-400">
                  {p.author && <span>by {p.author}</span>}
                  <span>{new Date(p.created_at).toLocaleDateString('en', { dateStyle: 'medium' })}</span>
                  {(p.views ?? 0) > 0 && <span>👁 {p.views}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold
                  ${p.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-600'}`}>
                  {p.status === 'published' ? '🌐 Published' : '✏️ Draft'}
                </span>
                <button onClick={() => setModal({ open: true, post: p })} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500">✏️</button>
                <button
                  onClick={() => { if (confirm(`Delete "${p.title}"?`)) remove.mutate(p.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition text-red-400"
                >🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <PostModal
          post={modal.post}
          onClose={() => setModal({ open: false, post: null })}
          onSave={d => save.mutate(d)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}
