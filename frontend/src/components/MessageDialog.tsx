import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type DialogPayload = {
  id: string;
  title?: string;
  message: string;
  type?: 'info' | 'error' | 'confirm';
  resolve: (value: any) => void;
};

const EVENT_NAME = 'app-show-dialog';

export function showMessage(message: string, title?: string) {
  return new Promise<void>((resolve) => {
    const ev = new CustomEvent(EVENT_NAME, { detail: { id: String(Date.now()), title, message, type: 'info', resolve } });
    window.dispatchEvent(ev as Event);
  });
}

export function showError(message: string, title?: string) {
  return new Promise<void>((resolve) => {
    const ev = new CustomEvent(EVENT_NAME, { detail: { id: String(Date.now()), title, message, type: 'error', resolve } });
    window.dispatchEvent(ev as Event);
  });
}

export function showConfirm(message: string, title?: string) {
  return new Promise<boolean>((resolve) => {
    const ev = new CustomEvent(EVENT_NAME, { detail: { id: String(Date.now()), title, message, type: 'confirm', resolve } });
    window.dispatchEvent(ev as Event);
  });
}

export default function MessageDialog() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<DialogPayload | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      const d = custom.detail as DialogPayload;
      setPayload(d);
      setOpen(true);
    };
    window.addEventListener(EVENT_NAME, handler as EventListener);
    return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
  }, []);

  const safePayload: DialogPayload = payload ?? { id: '', message: '', type: 'info', resolve: () => { } };

  const onClose = (val?: any) => {
    if (!payload) return;
    try { payload.resolve(val); } catch { }
    setOpen(false);
    setPayload(null);
  };

  const title = useMemo(() => {
    if (safePayload.title) return safePayload.title;
    if (safePayload.type === 'error') return t('dialog.errorTitle', 'Error');
    if (safePayload.type === 'confirm') return t('dialog.confirmTitle', 'Confirm');
    return t('dialog.infoTitle', 'Information');
  }, [safePayload.title, safePayload.type, t]);

  const styles = useMemo(() => {
    switch (safePayload.type) {
      case 'error':
        return {
          header: 'bg-red-600',
          icon: (
            <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 10-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 10-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          action: 'bg-red-600 hover:bg-red-700',
          border: 'border-red-600'
        };
      case 'confirm':
        return {
          header: 'bg-primary-600',
          icon: (
            <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L9 13.414l4.707-4.707z" clipRule="evenodd" />
            </svg>
          ),
          action: 'bg-primary-600 hover:bg-primary-700',
          border: 'border-primary-600'
        };
      default:
        return {
          header: 'bg-accent-500',
          icon: (
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 18a6 6 0 110-12 6 6 0 010 12z" />
            </svg>
          ),
          action: 'bg-accent-500 hover:bg-accent-600',
          border: 'border-accent-500'
        };
    }
  }, [safePayload.type]);

  if (!open || !payload) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border-t-4" style={{ borderTopColor: 'transparent' }}>
        <div className={`flex items-center gap-2 px-6 py-3 rounded-t-xl ${styles.header}`}>
          {styles.icon}
          <h3 className="text-white text-base font-semibold">{title}</h3>
          <button aria-label={t('dialog.close', 'Close')} onClick={() => onClose()} className="ml-auto text-white/90 hover:text-white">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6 text-sm text-dark-800">{payload.message}</div>
          <div className="flex justify-end gap-3">
            {payload.type === 'confirm' ? (
              <>
                <button onClick={() => onClose(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-dark-900 font-medium">
                  {t('dialog.cancel', 'Cancel')}
                </button>
                <button autoFocus onClick={() => onClose(true)} className={`px-4 py-2 rounded-lg text-white font-semibold ${styles.action}`}>
                  {t('dialog.ok', 'OK')}
                </button>
              </>
            ) : (
              <button autoFocus onClick={() => onClose()} className={`px-4 py-2 rounded-lg text-white font-semibold ${styles.action}`}>
                {t('dialog.ok', 'OK')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
