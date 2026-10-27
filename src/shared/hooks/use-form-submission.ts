import { useRef, useState } from 'react';
import { getApiErrorMessage } from '@/shared/utils/errors';

/** Conserva el formulario y evita envíos simultáneos mientras se guarda. */
export function useFormSubmission<T>(onSubmit: (values: T) => unknown | Promise<unknown>, externalBusy = false) {
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submit = async (values: T) => {
    if (pending.current || externalBusy) return;
    pending.current = true;
    setSaving(true);
    setSubmitError('');
    try { await onSubmit(values); }
    catch (error) { setSubmitError(getApiErrorMessage(error)); }
    finally { pending.current = false; setSaving(false); }
  };
  return { submit, busy: externalBusy || saving, submitError };
}
