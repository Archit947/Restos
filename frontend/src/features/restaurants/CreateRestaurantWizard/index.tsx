import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { restaurantsApi } from '@/api/restaurants.api';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Step1Info } from './Step1Info';
import { Step2Address } from './Step2Address';
import { Step3Website } from './Step3Website';
import { Step4Subscription } from './Step4Subscription';
import { Step5Credentials } from './Step5Credentials';
import { clsx } from 'clsx';

const STEPS = [
  { id: 1, label: 'Restaurant Info', description: 'Basic information' },
  { id: 2, label: 'Address', description: 'Location details' },
  { id: 3, label: 'Website', description: 'Domain & settings' },
  { id: 4, label: 'Subscription', description: 'Plan & features' },
  { id: 5, label: 'Credentials', description: 'Login details' },
];

export interface WizardFormData {
  // Step 1
  restaurant_name: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  gst_number: string;
  pan_number: string;
  business_reg_no: string;
  cuisine_type: string;
  description: string;
  logo: File | null;
  cover_image: File | null;
  // Step 2
  country: string;
  state: string;
  city: string;
  area: string;
  zip_code: string;
  address: string;
  latitude: string;
  longitude: string;
  // Step 3
  website_title: string;
  website_subtitle: string;
  subdomain: string;
  template_slug: string;
  // Step 4
  plan_id: string;
  trial_days: number;
  status: string;
  website_enabled: boolean;
  cms_enabled: boolean;
  blog_enabled: boolean;
  reservation_enabled: boolean;
  event_enabled: boolean;
  affiliate_enabled: boolean;
  marketing_enabled: boolean;
  has_store: boolean;
}

const defaultData: WizardFormData = {
  restaurant_name: '', business_name: '', owner_name: '', email: '',
  phone: '', whatsapp: '', gst_number: '', pan_number: '', business_reg_no: '',
  cuisine_type: '', description: '', logo: null, cover_image: null,
  country: 'India', state: '', city: '', area: '', zip_code: '', address: '', latitude: '', longitude: '',
  website_title: '', website_subtitle: '', subdomain: '', template_slug: 'bloom',
  plan_id: '', trial_days: 14, status: 'trial',
  website_enabled: true, cms_enabled: true, blog_enabled: false,
  reservation_enabled: false, event_enabled: false, affiliate_enabled: false, marketing_enabled: false,
  has_store: false,
};

interface CreateRestaurantWizardProps {
  open: boolean;
  onClose: () => void;
}

export function CreateRestaurantWizard({ open, onClose }: CreateRestaurantWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>(defaultData);
  const [createdResult, setCreatedResult] = useState<{
    restaurantId: number;
    restaurantUID: string;
    username: string;
    tempPassword: string;
    subdomain: string;
    fullDomain: string;
    hasStore?: boolean;
    storeUsername?: string | null;
    storeTempPassword?: string | null;
  } | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: WizardFormData) => {
      const fd = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val instanceof File) fd.append(key, val);
        else if (val !== null && val !== undefined) fd.append(key, String(val));
      });
      return restaurantsApi.create(fd);
    },
    onSuccess: (res) => {
      const result = res.data.data;
      if (result) {
        setCreatedResult(result);
        setCurrentStep(5);
        queryClient.invalidateQueries({ queryKey: ['restaurants'] });
        toast.success('Restaurant created successfully!');
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create restaurant.';
      toast.error(msg);
    },
  });

  const updateData = (patch: Partial<WizardFormData>) => setFormData(prev => ({ ...prev, ...patch }));

  const handleClose = () => {
    setCurrentStep(1);
    setFormData(defaultData);
    setCreatedResult(null);
    onClose();
  };

  const handleFinish = () => {
    handleClose();
    if (createdResult) navigate(`/restaurants/${createdResult.restaurantId}`);
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
    else if (currentStep === 4) createMutation.mutate(formData);
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 5) setCurrentStep(currentStep - 1);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="2xl"
      title={createdResult ? '🎉 Restaurant Created!' : 'Add New Restaurant'}
      description={createdResult ? 'Your restaurant is ready to go.' : `Step ${currentStep} of 4 — ${STEPS[currentStep - 1]?.description}`}
    >
      {/* Step indicator */}
      {!createdResult && (
        <div className="flex items-center gap-0 mb-6 -mx-2">
          {STEPS.slice(0, 4).map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                currentStep === step.id
                  ? 'bg-brand-50 text-brand-700'
                  : currentStep > step.id
                    ? 'text-emerald-600'
                    : 'text-gray-400'
              )}>
                <span className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  currentStep === step.id ? 'bg-brand-600 text-white' :
                  currentStep > step.id ? 'bg-emerald-500 text-white' :
                  'bg-gray-200 text-gray-500'
                )}>
                  {currentStep > step.id ? '✓' : step.id}
                </span>
                <span className="hidden sm:block">{step.label}</span>
              </div>
              {index < 3 && (
                <div className={clsx('flex-1 h-px mx-1', currentStep > step.id ? 'bg-emerald-300' : 'bg-gray-200')} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && <Step1Info data={formData} onChange={updateData} />}
        {currentStep === 2 && <Step2Address data={formData} onChange={updateData} />}
        {currentStep === 3 && <Step3Website data={formData} onChange={updateData} />}
        {currentStep === 4 && <Step4Subscription data={formData} onChange={updateData} />}
        {currentStep === 5 && createdResult && (
          <Step5Credentials result={createdResult} onFinish={handleFinish} />
        )}
      </div>

      {/* Footer */}
      {!createdResult && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
          <Button variant="secondary" onClick={handleBack} disabled={currentStep === 1}>
            ← Back
          </Button>
          <Button
            onClick={handleNext}
            loading={createMutation.isPending}
          >
            {currentStep === 4 ? '🚀 Create Restaurant' : 'Next →'}
          </Button>
        </div>
      )}
    </Modal>
  );
}
