import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { settingsApi } from '@/api/settings.api';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { ConfirmDialog, Modal } from '@/components/common/Modal';
import { Input, Select } from '@/components/common/Input';
import { Card } from '@/components/common/Card';
import type { WebsiteTemplate } from '@/types';
import { clsx } from 'clsx';

const CATEGORIES = ['modern', 'classic', 'minimal', 'luxury', 'fast_food', 'cafe', 'fine_dining'];

export function TemplateListPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', category: 'modern' });

  const { data: templates = [], isLoading } = useQuery<WebsiteTemplate[]>({
    queryKey: ['templates'],
    queryFn: () => settingsApi.getTemplates().then(r => r.data.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newTemplate) => {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v));
      return settingsApi.createTemplate(fd);
    },
    onSuccess: () => {
      toast.success('Template created!');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowForm(false);
      setNewTemplate({ name: '', description: '', category: 'modern' });
    },
    onError: () => toast.error('Failed to create template.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => settingsApi.deleteTemplate(id),
    onSuccess: () => {
      toast.success('Template deleted.');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete template.'),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Website Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">{templates.length} templates available</p>
        </div>
        <Button onClick={() => setShowForm(true)}
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
              <div className={clsx('h-32 flex items-center justify-center', 'bg-gradient-to-br from-gray-100 to-gray-200')}>
                {template.thumbnail ? (
                  <img src={`/uploads/templates/${template.thumbnail}`} alt={template.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-5xl opacity-20 select-none">🎨</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
                    <p className="text-xs text-gray-400 capitalize">{template.category.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={template.is_active ? 'success' : 'gray'} dot>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {template.is_default && <Badge variant="blue">Default</Badge>}
                  </div>
                </div>
                {template.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{template.description}</p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">v{template.version}</span>
                  <div className="flex-1" />
                  <button
                    onClick={() => setDeleteId(template.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Create Template" size="md">
        <div className="space-y-4">
          <Input label="Template Name" required placeholder="Modern Classic" value={newTemplate.name} onChange={(e) => setNewTemplate(p => ({ ...p, name: e.target.value }))} />
          <Input label="Description" placeholder="Brief description" value={newTemplate.description} onChange={(e) => setNewTemplate(p => ({ ...p, description: e.target.value }))} />
          <Select label="Category" value={newTemplate.category} onChange={(e) => setNewTemplate(p => ({ ...p, category: e.target.value }))}
            options={CATEGORIES.map(c => ({ value: c, label: c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }))} />
        </div>
        <div className="flex gap-3 mt-6">
          <Button fullWidth variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button fullWidth onClick={() => createMutation.mutate(newTemplate)} loading={createMutation.isPending}>Create Template</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        title="Delete Template"
        message="Are you sure you want to delete this template? This will affect restaurants using it."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
