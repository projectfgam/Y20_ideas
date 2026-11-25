import {useEffect, useState, type FormEvent} from 'react';
import {Eye, EyeOff, KeyRound, ShieldCheck, X} from 'lucide-react';
import {MANAGER_SECRET_CODE} from '../constants';

interface ManagerAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManagerAccessModal({
  isOpen,
  onClose,
  onSuccess,
}: ManagerAccessModalProps) {
  const [secretCode, setSecretCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSecretCode('');
      setShowCode(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (secretCode.trim() === MANAGER_SECRET_CODE) {
      setErrorMessage('');
      onSuccess();
      onClose();
    } else {
      setErrorMessage('الرمز السري غير صحيح. الرجاء المحاولة مرة أخرى.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manager-access-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07162E]/70 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#1E40AF] bg-gradient-to-br from-[#0F294D] to-[#173E75] p-6 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#93C5FD]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 id="manager-access-title" className="font-display text-lg font-bold text-white">
              دخول المبرمج / المدير
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg p-1.5 text-[#93C5FD] hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="manager-modal-code"
              className="block text-xs font-medium text-[#DBEAFE] mb-1.5"
            >
              أدخل الرمز السري للتعديل والإدارة
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#93C5FD]" />
              <input
                id="manager-modal-code"
                type={showCode ? 'text' : 'password'}
                value={secretCode}
                onChange={(e) => {
                  setSecretCode(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="الرمز السري"
                autoFocus
                autoComplete="off"
                dir="ltr"
                className="w-full min-h-[44px] rounded-xl border border-[#3B82F6]/45 bg-[#081830]/80 pr-10 pl-11 py-2.5 text-sm text-white placeholder:text-[#60A5FA]/60 text-right focus:border-[#60A5FA] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCode((prev) => !prev)}
                aria-label={showCode ? 'إخفاء الرمز' : 'إظهار الرمز'}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-[#93C5FD] hover:text-white cursor-pointer"
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errorMessage && (
              <p role="alert" className="mt-2 text-xs font-medium text-[#93C5FD]">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-xl border border-[#3B82F6]/40 px-4 py-2 text-xs font-semibold text-[#DBEAFE] hover:bg-white/10 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="min-h-[40px] rounded-xl bg-[#3B82F6] px-5 py-2 text-xs font-bold text-white hover:bg-[#60A5FA] hover:text-[#08172E] transition-colors cursor-pointer"
            >
              دخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
