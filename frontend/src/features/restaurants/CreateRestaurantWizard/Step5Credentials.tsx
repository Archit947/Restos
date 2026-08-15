import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/common/Button';
import { PLATFORM_DOMAIN } from '@/utils/constants';

interface CredentialsResult {
  restaurantId: number;
  restaurantUID: string;
  username: string;
  tempPassword: string;
  subdomain: string;
  fullDomain: string;
  hasStore?: boolean;
  storeUsername?: string | null;
  storeTempPassword?: string | null;
}

interface Step5Props {
  result: CredentialsResult;
  onFinish: () => void;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-mono font-semibold text-gray-900 truncate">{value}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
        title="Copy"
      >
        {copied ? (
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function Step5Credentials({ result, onFinish }: Step5Props) {
  const loginUrl      = `https://${PLATFORM_DOMAIN}/restaurant/login`;
  const storeLoginUrl = `https://${PLATFORM_DOMAIN}/store/login`;

  return (
    <div className="space-y-5">
      {/* Success message */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-bold text-emerald-900 text-base mb-1">Restaurant Created Successfully!</h3>
        <p className="text-sm text-emerald-700">
          The complete tenant workspace has been set up automatically. Share the credentials below with the restaurant owner.
        </p>
      </div>

      {/* Credentials */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900">🔐 Login Credentials</p>
        <CopyField label="Restaurant ID" value={result.restaurantUID} />
        <CopyField label="Username" value={result.username} />
        <CopyField label="Temporary Password" value={result.tempPassword} />
        <CopyField label="Login URL" value={loginUrl} />
      </div>

      {/* Domain info */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-900">🌐 Website</p>
        <CopyField label="Restaurant Website" value={`https://${result.fullDomain}`} />
        <CopyField label="Subdomain" value={result.subdomain} />
      </div>

      {/* Store credentials (if enabled) */}
      {result.hasStore && result.storeUsername && result.storeTempPassword && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">🏪 Store Admin Credentials</p>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Store Portal</span>
          </div>
          <CopyField label="Store Username"         value={result.storeUsername} />
          <CopyField label="Store Temp Password"    value={result.storeTempPassword} />
          <CopyField label="Store Login URL"        value={storeLoginUrl} />
        </div>
      )}

      {/* What was created */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-800 mb-2">✅ What was automatically created:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Isolated tenant workspace (ID: {result.restaurantUID})</li>
          <li>• Subdomain: {result.fullDomain}</li>
          <li>• 10 default CMS pages (Home, About, Menu, Gallery, etc.)</li>
          <li>• Default website with chosen template</li>
          <li>• CMS settings and default navigation</li>
          <li>• Secure login credentials (first login requires password change)</li>
          {result.hasStore && <li>• Affiliated store portal with separate store admin credentials</li>}
        </ul>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
        <p className="text-xs text-amber-700">
          ⚠️ The temporary password will be invalidated after the first login. Please share these credentials securely with the restaurant owner.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button fullWidth onClick={onFinish}>
          View Restaurant →
        </Button>
        <Button variant="secondary" fullWidth onClick={() => {
          const allCreds = `Restaurant: ${result.restaurantUID}\nUsername: ${result.username}\nPassword: ${result.tempPassword}\nWebsite: https://${result.fullDomain}\nLogin: ${loginUrl}`;
          navigator.clipboard.writeText(allCreds);
          toast.success('All credentials copied!');
        }}>
          Copy All Credentials
        </Button>
      </div>
    </div>
  );
}
