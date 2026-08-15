import React from 'react';
import { Input, Select, Textarea } from '@/components/common/Input';
import { COUNTRIES } from '@/utils/constants';
import type { WizardFormData } from './index';

interface Step2Props {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
}

export function Step2Address({ data, onChange }: Step2Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Country"
          required
          value={data.country}
          onChange={(e) => onChange({ country: e.target.value })}
          options={COUNTRIES.map(c => ({ value: c, label: c }))}
        />
        <Input
          label="State / Province"
          required
          placeholder="e.g. Maharashtra"
          value={data.state}
          onChange={(e) => onChange({ state: e.target.value })}
        />
        <Input
          label="City"
          required
          placeholder="e.g. Mumbai"
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Area / Locality"
          placeholder="e.g. Bandra West"
          value={data.area}
          onChange={(e) => onChange({ area: e.target.value })}
        />
        <Input
          label="ZIP / Postal Code"
          placeholder="e.g. 400050"
          value={data.zip_code}
          onChange={(e) => onChange({ zip_code: e.target.value })}
        />
      </div>
      <Textarea
        label="Complete Address"
        required
        placeholder="Full street address..."
        rows={3}
        value={data.address}
        onChange={(e) => onChange({ address: e.target.value })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Latitude"
          type="number"
          placeholder="e.g. 19.0760"
          value={data.latitude}
          onChange={(e) => onChange({ latitude: e.target.value })}
          hint="Optional — used for Google Maps integration"
        />
        <Input
          label="Longitude"
          type="number"
          placeholder="e.g. 72.8777"
          value={data.longitude}
          onChange={(e) => onChange({ longitude: e.target.value })}
          hint="Optional — used for Google Maps integration"
        />
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>📍 Tip:</strong> You can find the latitude and longitude from Google Maps by right-clicking any location and selecting "What's here?"
      </div>
    </div>
  );
}
