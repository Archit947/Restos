import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { settingsApi } from '@/api/settings.api';
import { Card, SectionHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input, Toggle } from '@/components/common/Input';
import type { PlatformSetting } from '@/types';
import { clsx } from 'clsx';

type SettingsGroup = Record<string, PlatformSetting[]>;

const GROUPS = [
  { key: 'general', label: 'General', icon: '⚙️' },
  { key: 'email', label: 'Email / SMTP', icon: '📧' },
  { key: 'storage', label: 'Storage', icon: '💾' },
  { key: 'security', label: 'Security', icon: '🔐' },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeGroup, setActiveGroup] = useState('general');
  const [changedValues, setChangedValues] = useState<Record<string, string>>({});

  const { data: groupedSettings, isLoading } = useQuery<SettingsGroup>({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll().then(r => r.data.data || {}),
  });

  const mutation = useMutation({
    mutationFn: (settings: Array<{ key: string; value: string }>) =>
      settingsApi.update(settings),
    onSuccess: () => {
      toast.success('Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setChangedValues({});
    },
    onError: () => toast.error('Failed to save settings.'),
  });

  const handleChange = (key: string, value: string) => {
    setChangedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const updates = Object.entries(changedValues).map(([key, value]) => ({ key, value }));
    if (!updates.length) return toast('No changes to save.', { icon: 'ℹ️' });
    mutation.mutate(updates);
  };

  const currentSettings = groupedSettings?.[activeGroup] || [];
  const hasChanges = Object.keys(changedValues).length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure global platform settings</p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} loading={mutation.isPending}>
            Save Changes ({Object.keys(changedValues).length})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Sidebar nav */}
        <div className="col-span-12 md:col-span-3">
          <Card padding="sm">
            <nav className="space-y-0.5">
              {GROUPS.map((group) => (
                <button
                  key={group.key}
                  onClick={() => setActiveGroup(group.key)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    activeGroup === group.key
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <span>{group.icon}</span>
                  {group.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Settings panel */}
        <div className="col-span-12 md:col-span-9">
          <Card>
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                    <div className="h-10 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : currentSettings.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No settings in this group</div>
            ) : (
              <div className="space-y-5">
                {currentSettings.map((setting) => {
                  const currentValue = changedValues[setting.key] ?? setting.value ?? '';

                  if (setting.type === 'boolean') {
                    return (
                      <div key={setting.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{setting.label || setting.key}</p>
                          {setting.description && <p className="text-xs text-gray-400 mt-0.5">{setting.description}</p>}
                        </div>
                        <Toggle
                          checked={currentValue === 'true'}
                          onChange={(v) => handleChange(setting.key, String(v))}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={setting.key}>
                      <Input
                        label={setting.label || setting.key}
                        type={setting.type === 'secret' ? 'password' : 'text'}
                        placeholder={setting.type === 'secret' ? '••••••••' : ''}
                        value={currentValue}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        hint={setting.description || undefined}
                      />
                    </div>
                  );
                })}

                <div className="flex justify-end pt-2 border-t border-gray-100">
                  <Button
                    onClick={handleSave}
                    loading={mutation.isPending}
                    disabled={!hasChanges}
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
