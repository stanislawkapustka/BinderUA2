import React, { useEffect, useState } from 'react';

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

  if (!open || !payload) return null;

  const onClose = (val?: any) => {
    try { payload.resolve(val); } catch {}
    setOpen(false);
    setPayload(null);
  };

  const title = payload.title || 'Komunikat ze strony localhost:3000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="mb-4 text-sm text-gray-800">{payload.message}</div>
        <div className="flex justify-end gap-3">
          {payload.type === 'confirm' ? (
            <>
              <button onClick={() => onClose(false)} className="px-4 py-2 bg-gray-200 rounded">Anuluj</button>
              <button onClick={() => onClose(true)} className="px-4 py-2 bg-accent-500 text-white rounded">OK</button>
            </>
          ) : (
            <button onClick={() => onClose()} className="px-4 py-2 bg-accent-500 text-white rounded">OK</button>
          )}
        </div>
      </div>
    </div>
  );
}
