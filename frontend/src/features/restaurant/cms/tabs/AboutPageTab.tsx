import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rCmsApi } from '../../../../api/restaurantAdmin';

// ─── Types ────────────────────────────────────────────────────────────────────
type BlockType = 'heading' | 'paragraph' | 'image';

interface Block {
  id: string;               // local-only key for React rendering
  type: BlockType;
  content?: string;         // text for heading / paragraph
  url?: string;             // src for image
  level?: 1 | 2 | 3;       // h1 / h2 / h3 for headings
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Block controls ───────────────────────────────────────────────────────────
function BlockCard({
  block, index, total,
  onChange, onDelete, onMove, onUpload,
}: {
  block: Block; index: number; total: number;
  onChange: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onUpload: (id: string, file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const cardStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 12,
    backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #d1d5db',
    fontSize: 14, color: '#111827', fontFamily: 'inherit', boxSizing: 'border-box',
    outline: 'none',
  };

  const iconBtn: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '4px 6px', borderRadius: 6,
    color: '#9ca3af', lineHeight: 1,
  };

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>
          {block.type === 'heading' ? `Heading (H${block.level ?? 2})` : block.type === 'paragraph' ? 'Paragraph' : 'Image'}
        </span>
        <button style={iconBtn} title="Move up"   disabled={index === 0}         onClick={() => onMove(block.id, -1)}>↑</button>
        <button style={iconBtn} title="Move down" disabled={index === total - 1} onClick={() => onMove(block.id, 1)}>↓</button>
        <button
          style={{ ...iconBtn, color: '#ef4444' }}
          title="Delete block"
          onClick={() => onDelete(block.id)}
        >✕</button>
      </div>

      {/* Heading block */}
      {block.type === 'heading' && (
        <>
          <label style={labelStyle}>Heading level</label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {([1, 2, 3] as const).map(lv => (
              <button key={lv} onClick={() => onChange(block.id, { level: lv })}
                style={{
                  padding: '5px 14px', borderRadius: 6, border: '1px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  borderColor: block.level === lv ? '#059669' : '#d1d5db',
                  backgroundColor: block.level === lv ? '#ecfdf5' : '#fff',
                  color: block.level === lv ? '#059669' : '#374151',
                }}>H{lv}</button>
            ))}
          </div>
          <label style={labelStyle}>Heading text</label>
          <input style={inputStyle} value={block.content ?? ''}
            onChange={e => onChange(block.id, { content: e.target.value })}
            placeholder="Enter heading…"
          />
        </>
      )}

      {/* Paragraph block */}
      {block.type === 'paragraph' && (
        <>
          <label style={labelStyle}>Text</label>
          <textarea
            value={block.content ?? ''}
            onChange={e => onChange(block.id, { content: e.target.value })}
            rows={4}
            placeholder="Write your paragraph here…"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </>
      )}

      {/* Image block */}
      {block.type === 'image' && (
        <>
          {block.url && (
            <img src={block.url} alt="" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(block.id, f); }} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, cursor: 'pointer', background: '#f9fafb' }}
            >
              {block.url ? '🔄 Change Image' : '📁 Upload Image'}
            </button>
            {block.url && <span style={{ fontSize: 12, color: '#6b7280' }}>Image uploaded ✓</span>}
          </div>
          <label style={labelStyle}>Alt text / caption (optional)</label>
          <input style={inputStyle} value={block.content ?? ''}
            onChange={e => onChange(block.id, { content: e.target.value })}
            placeholder="Short description of the image…"
          />
        </>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────
export default function AboutPageTab() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cms-about-page'],
    queryFn: () => rCmsApi.getAboutPage().then(r => r.data.data),
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Hydrate from server on first load
  useEffect(() => {
    if (data?.blocks) {
      setBlocks((data.blocks as Omit<Block, 'id'>[]).map(b => ({ id: uid(), ...b })));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const clean = blocks.map(({ id: _id, ...rest }) => rest);
      return rCmsApi.updateAboutPage({ blocks: clean });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-about-page'] });
      setDirty(false);
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2500);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ blockId, file }: { blockId: string; file: File }) => {
      const fd = new FormData();
      fd.append('image', file);
      const res = await rCmsApi.uploadAboutImage(fd);
      return { blockId, url: res.data.data.url as string };
    },
    onSuccess: ({ blockId, url }) => {
      setBlocks(bs => bs.map(b => b.id === blockId ? { ...b, url } : b));
      setDirty(true);
    },
  });

  // Block mutations
  const addBlock = (type: BlockType) => {
    const newBlock: Block = { id: uid(), type, content: '', level: type === 'heading' ? 2 : undefined };
    setBlocks(bs => [...bs, newBlock]);
    setDirty(true);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...updates } : b));
    setDirty(true);
  };

  const deleteBlock = (id: string) => {
    setBlocks(bs => bs.filter(b => b.id !== id));
    setDirty(true);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks(bs => {
      const idx = bs.findIndex(b => b.id === id);
      if (idx < 0) return bs;
      const next = idx + dir;
      if (next < 0 || next >= bs.length) return bs;
      const arr = [...bs];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
    setDirty(true);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-400">Loading About page…</div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>About Page Builder</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Build your custom About page. Add headings, text, and images — drag to reorder.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {saveMsg && <span style={{ fontSize: 13, color: '#059669', fontWeight: 500 }}>✓ {saveMsg}</span>}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!dirty || saveMutation.isPending}
            style={{
              padding: '9px 22px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              backgroundColor: dirty ? '#059669' : '#d1d5db', color: '#fff',
              opacity: saveMutation.isPending ? 0.7 : 1, transition: 'background-color 0.2s',
            }}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Page'}
          </button>
        </div>
      </div>

      {/* Add block buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['heading', 'paragraph', 'image'] as BlockType[]).map(type => (
          <button key={type} onClick={() => addBlock(type)}
            style={{
              padding: '8px 16px', borderRadius: 20, border: '1.5px dashed #d1d5db',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', backgroundColor: '#f9fafb', color: '#374151',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color 0.15s, background-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#059669'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ecfdf5'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#d1d5db'; (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f9fafb'; }}
          >
            <span>{type === 'heading' ? 'H' : type === 'paragraph' ? '¶' : '🖼'}</span>
            <span>+ {type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {blocks.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 24px', border: '2px dashed #e5e7eb',
          borderRadius: 12, color: '#9ca3af', marginBottom: 24,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>No content yet.</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Click one of the buttons above to add your first block.</p>
        </div>
      )}

      {/* Block list */}
      {blocks.map((block, i) => (
        <BlockCard
          key={block.id}
          block={block}
          index={i}
          total={blocks.length}
          onChange={updateBlock}
          onDelete={deleteBlock}
          onMove={moveBlock}
          onUpload={(id, file) => uploadMutation.mutate({ blockId: id, file })}
        />
      ))}

      {/* Bottom save hint */}
      {dirty && blocks.length > 0 && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{
              padding: '10px 26px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              backgroundColor: '#059669', color: '#fff', opacity: saveMutation.isPending ? 0.7 : 1,
            }}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Page'}
          </button>
        </div>
      )}
    </div>
  );
}
