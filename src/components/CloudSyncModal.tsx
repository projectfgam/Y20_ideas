import {useEffect, useState, type ChangeEvent} from 'react';
import {
  Cloud,
  CloudDownload,
  CloudUpload,
  Download,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import {hasCloudTarget} from '../services/storage';
import type {AppSnapshot, CloudSyncConfig} from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  config: CloudSyncConfig;
  snapshot: AppSnapshot;
  onClose: () => void;
  onSaveConfig: (config: CloudSyncConfig) => void;
  onPushToCloud: (config: CloudSyncConfig) => Promise<void>;
  onPullFromCloud: (config: CloudSyncConfig) => Promise<boolean>;
  onImportSnapshot: (snapshot: AppSnapshot) => void;
}

export function CloudSyncModal({
  isOpen,
  config,
  snapshot,
  onClose,
  onSaveConfig,
  onPushToCloud,
  onPullFromCloud,
  onImportSnapshot,
}: CloudSyncModalProps) {
  const [draft, setDraft] = useState<CloudSyncConfig>(config);
  const [busyAction, setBusyAction] = useState<'push' | 'pull' | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(config);
      setStatusMsg('');
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const canSync = hasCloudTarget(draft);

  const handleSave = () => {
    onSaveConfig(draft);
    setStatusMsg('تم حفظ إعدادات المزامنة السحابية محلياً.');
  };

  const handlePush = async () => {
    setBusyAction('push');
    setStatusMsg('');
    try {
      onSaveConfig(draft);
      await onPushToCloud(draft);
      setStatusMsg('تم رفع جميع الأقسام والأفكار والتقييمات إلى قاعدة البيانات السحابية بنجاح.');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'تعذر الرفع إلى السحابة.');
    } finally {
      setBusyAction(null);
    }
  };

  const handlePull = async () => {
    setBusyAction('pull');
    setStatusMsg('');
    try {
      onSaveConfig(draft);
      const found = await onPullFromCloud(draft);
      setStatusMsg(
        found
          ? 'تم تحديث البيانات من قاعدة البيانات السحابية بنجاح.'
          : 'لم يتم العثور على بيانات محفوظة في القاعدة السحابية بعد.',
      );
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'تعذر السحب من السحابة.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `afkar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMsg('تم تنزيل نسخة احتياطية كاملة بصيغة JSON.');
  };

  const handleImportJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AppSnapshot;
      if (!Array.isArray(parsed.sections) || !Array.isArray(parsed.ideas)) {
        throw new Error('صيغة الملف غير صالحة');
      }
      onImportSnapshot(parsed);
      setStatusMsg('تم استيراد النسخة الاحتياطية وتحديث البيانات بنجاح.');
    } catch {
      setStatusMsg('تعذر قراءة ملف النسخة الاحتياطية. تأكد من صحة ملف JSON.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-sync-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07162E]/70 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#C7DCFA] bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-[#D7E6FD] bg-[#F4F8FF] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Cloud className="h-5 w-5 text-[#2563EB]" />
            <h2 id="cloud-sync-title" className="font-display text-lg font-bold text-[#0B1F3A]">
              طبقة الحفظ والربط بقاعدة بيانات سحابية
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-xl p-1.5 text-[#3B5A85] hover:bg-[#DBEAFE] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="rounded-xl border border-[#BFDBFE] bg-[#EAF2FF] p-4 text-xs leading-relaxed text-[#0F294D]">
            جميع الأفكار والتقييمات والاعتمادات والصور تُحفظ محلياً في المتصفح (IndexedDB) كنسخة احتياطية دائمة. لمشاركة نفس التحديثات مباشرة مع المسؤول عبر أي جهاز، اختر Firebase Firestore أو قاعدة بيانات سحابية أدناه.
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-4 py-3 cursor-pointer">
              <span className="text-sm font-semibold text-[#0B1F3A]">
                تفعيل المزامنة السحابية التلقائية
              </span>
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft({...draft, enabled: e.target.checked})}
                className="h-4 w-4 rounded border-[#93C5FD] text-[#2563EB]"
              />
            </label>

            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1.5">
                نوع قاعدة البيانات السحابية
              </label>
              <select
                value={draft.providerType}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    providerType: e.target.value as CloudSyncConfig['providerType'],
                  })
                }
                className="w-full rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-3.5 py-2.5 text-sm text-[#0B1F3A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
              >
                <option value="firebase-firestore">Firebase Firestore (موصى به)</option>
                <option value="firebase-rtdb">Firebase Realtime Database (REST URL)</option>
                <option value="custom-rest">نقطة اتصال REST JSON مخصصة</option>
              </select>
            </div>

            {draft.providerType === 'firebase-firestore' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F3A] mb-1.5">
                    معرف مشروع Firebase (Project ID)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={draft.firestoreProjectId ?? ''}
                    onChange={(e) =>
                      setDraft({...draft, firestoreProjectId: e.target.value})
                    }
                    placeholder="my-afkar-project"
                    className="w-full rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-3.5 py-2.5 text-sm text-[#0B1F3A] placeholder:text-[#60A5FA] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F3A] mb-1.5">
                    مسار المستند (Collection / Doc)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={draft.firestoreDocPath ?? 'afkar/workspace'}
                    onChange={(e) =>
                      setDraft({...draft, firestoreDocPath: e.target.value})
                    }
                    placeholder="afkar/workspace"
                    className="w-full rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-3.5 py-2.5 text-sm text-[#0B1F3A] placeholder:text-[#60A5FA] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A] mb-1.5">
                  رابط قاعدة البيانات السحابية (Endpoint URL)
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={draft.endpointUrl}
                  onChange={(e) => setDraft({...draft, endpointUrl: e.target.value})}
                  placeholder="https://your-project-default-rtdb.firebaseio.com"
                  className="w-full rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-3.5 py-2.5 text-sm text-[#0B1F3A] placeholder:text-[#60A5FA] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1.5">
                مفتاح الوصول / التوكن (اختياري)
              </label>
              <input
                type="password"
                dir="ltr"
                value={draft.authToken ?? ''}
                onChange={(e) => setDraft({...draft, authToken: e.target.value})}
                placeholder="Auth token / secret"
                className="w-full rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-3.5 py-2.5 text-sm text-[#0B1F3A] placeholder:text-[#60A5FA] focus:border-[#2563EB] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={busyAction !== null || !canSync}
                onClick={handlePush}
                className="inline-flex items-center justify-center gap-2 min-h-[42px] rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-45 cursor-pointer"
              >
                {busyAction === 'push' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CloudUpload className="h-4 w-4" />
                )}
                <span>رفع التغييرات للسحابة</span>
              </button>

              <button
                type="button"
                disabled={busyAction !== null || !canSync}
                onClick={handlePull}
                className="inline-flex items-center justify-center gap-2 min-h-[42px] rounded-xl border border-[#2563EB] bg-white px-4 py-2 text-xs font-semibold text-[#1D4ED8] hover:bg-[#EAF2FF] disabled:opacity-45 cursor-pointer"
              >
                {busyAction === 'pull' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CloudDownload className="h-4 w-4" />
                )}
                <span>سحب التحديثات من السحابة</span>
              </button>
            </div>
          </div>

          {/* Local JSON Backup & Restore */}
          <div className="border-t border-[#D7E6FD] pt-5">
            <h3 className="text-xs font-bold text-[#0B1F3A] mb-3">
              نسخ احتياطي ونقل يدوي بين الأجهزة (JSON)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center justify-center gap-2 min-h-[42px] rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-4 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-[#EAF2FF] cursor-pointer"
              >
                <Download className="h-4 w-4 text-[#2563EB]" />
                <span>تصدير نسخة احتياطية</span>
              </button>

              <label className="inline-flex items-center justify-center gap-2 min-h-[42px] rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-4 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-[#EAF2FF] cursor-pointer">
                <Upload className="h-4 w-4 text-[#2563EB]" />
                <span>استيراد نسخة احتياطية</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {statusMsg && (
            <p className="rounded-xl border border-[#BFDBFE] bg-[#EAF2FF] px-4 py-2.5 text-xs font-semibold text-[#1E40AF]">
              {statusMsg}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#D7E6FD] bg-[#F4F8FF] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-xl border border-[#C7DCFA] bg-white px-4 py-2 text-sm font-semibold text-[#3B5A85] hover:bg-[#EAF2FF] cursor-pointer"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[40px] rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] cursor-pointer"
          >
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  );
}
