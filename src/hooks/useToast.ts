import { sileo, type SileoOptions } from 'sileo';

type ToastInput = string | (SileoOptions & { message?: string });

const toOptions = (input: ToastInput): SileoOptions => {
  if (typeof input === 'string') {
    return { title: input };
  }

  if (input.message && !input.title) {
    const { message, ...rest } = input;
    return { ...rest, title: message };
  }

  return input;
};

export function useToast() {
  const toastApi = {
    show: (input: ToastInput) => sileo.show(toOptions(input)),
    success: (input: ToastInput) => sileo.success(toOptions(input)),
    error: (input: ToastInput) => sileo.error(toOptions(input)),
    warning: (input: ToastInput) => sileo.warning(toOptions(input)),
    info: (input: ToastInput) => sileo.info(toOptions(input)),
    loading: (input: ToastInput) => sileo.show(toOptions(input)),
    promise: <T,>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) =>
      sileo.promise(promise, {
        loading: { title: messages.loading },
        success: { title: messages.success },
        error: { title: messages.error },
      }),
    dismiss: (id: string) => sileo.dismiss(id),
    clear: () => sileo.clear(),
  };

  return {
    toast: toastApi,
    ...toastApi,
  };
}
