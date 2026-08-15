import React, { useRef } from 'react';
import { Input, Textarea, Select } from '@/components/common/Input';
import { CUISINE_TYPES } from '@/utils/constants';
import type { WizardFormData } from './index';

interface Step1Props {
  data: WizardFormData;
  onChange: (patch: Partial<WizardFormData>) => void;
}

export function Step1Info({ data, onChange }: Step1Props) {
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Restaurant Name"
          required
          placeholder="e.g. Biriyani House"
          value={data.restaurant_name}
          onChange={(e) => {
            onChange({ restaurant_name: e.target.value });
            if (!data.website_title) onChange({ website_title: e.target.value });
          }}
        />
        <Input
          label="Business Name"
          placeholder="Legal business entity name"
          value={data.business_name}
          onChange={(e) => onChange({ business_name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Owner Name"
          required
          placeholder="Full name"
          value={data.owner_name}
          onChange={(e) => onChange({ owner_name: e.target.value })}
        />
        <Input
          label="Email Address"
          type="email"
          required
          placeholder="owner@restaurant.com"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone Number"
          required
          placeholder="+91 9876543210"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
        <Input
          label="WhatsApp Number"
          placeholder="+91 9876543210 (if different)"
          value={data.whatsapp}
          onChange={(e) => onChange({ whatsapp: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="GST Number"
          placeholder="22AAAAA0000A1Z5"
          value={data.gst_number}
          onChange={(e) => onChange({ gst_number: e.target.value })}
        />
        <Input
          label="PAN Number"
          placeholder="AAAAA0000A"
          value={data.pan_number}
          onChange={(e) => onChange({ pan_number: e.target.value })}
        />
        <Input
          label="Business Reg. No."
          placeholder="Registration number"
          value={data.business_reg_no}
          onChange={(e) => onChange({ business_reg_no: e.target.value })}
        />
      </div>
      <Select
        label="Cuisine Type"
        placeholder="Select cuisine type"
        value={data.cuisine_type}
        onChange={(e) => onChange({ cuisine_type: e.target.value })}
        options={CUISINE_TYPES.map(c => ({ value: c, label: c }))}
      />
      <Textarea
        label="Description"
        placeholder="Brief description of the restaurant..."
        rows={3}
        value={data.description}
        onChange={(e) => onChange({ description: e.target.value })}
      />

      {/* Logo & Cover */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Restaurant Logo</p>
          <div
            onClick={() => logoRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
          >
            {data.logo ? (
              <img src={URL.createObjectURL(data.logo)} alt="Logo" className="w-16 h-16 object-cover rounded-xl mx-auto" />
            ) : (
              <div className="text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Click to upload logo</p>
              </div>
            )}
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => onChange({ logo: e.target.files?.[0] || null })} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Cover Image</p>
          <div
            onClick={() => coverRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
          >
            {data.cover_image ? (
              <img src={URL.createObjectURL(data.cover_image)} alt="Cover" className="w-full h-16 object-cover rounded-xl" />
            ) : (
              <div className="text-gray-400">
                <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Click to upload cover</p>
              </div>
            )}
          </div>
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => onChange({ cover_image: e.target.files?.[0] || null })} />
        </div>
      </div>
    </div>
  );
}
