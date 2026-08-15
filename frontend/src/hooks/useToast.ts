import toast from 'react-hot-toast';

export function useToast() {
  const success = (message: string) => toast.success(message);
  const error = (message: string) => toast.error(message);
  const info = (message: string) => toast(message, { icon: 'ℹ️' });
  const warning = (message: string) => toast(message, { icon: '⚠️' });
  const loading = (message: string) => toast.loading(message);
  const dismiss = (id?: string) => toast.dismiss(id);

  const apiError = (err: unknown, fallback = 'Something went wrong.') => {
    const message =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
    toast.error(message);
  };

  return { success, error, info, warning, loading, dismiss, apiError };
}
