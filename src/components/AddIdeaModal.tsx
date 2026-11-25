import {useEffect, useState, type ChangeEvent, type FormEvent} from 'react';
import {Check, FileText, ImagePlus, Loader2, Trash2, Upload, X} from 'lucide-react';
import {
  extractIdeasFromPdf,
  readFileAsDataUrl,
  type ExtractedPdfIdea,
} from '../services/pdfExtractor';
import type {IdeaAttachment, IdeaItem} from '../types';

interface AddIdeaModalProps {
  isOpen: boolean;
  sectionTitle: string;
  editingIdea: IdeaItem | null;
  onClose: () => void;
  onSaveManual: (data: {
    title: string;
    details: string;
    attachment?: IdeaAttachment;
    sourceType: 'manual' | 'pdf';
  }) => void;
  onSaveBatchFromPdf: (
    items: Array<{
      title: string;
      details: string;
      attachment?: IdeaAttachment;
    }>,
  ) => void;
}

export function AddIdeaModal({
  isOpen,
  sectionTitle,
  editingIdea,
  onClose,
  onSaveManual,
  onSaveBatchFromPdf,
}: AddIdeaModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'pdf'>('manual');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [imageName, setImageName] = useState<string | undefined>(undefined);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | undefined>(undefined);
  const [pdfName, setPdfName] = useState<string | undefined>(undefined);

  // PDF extraction tab states
  const [isExtracting, setIsExtracting] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [extractedCandidates, setExtractedCandidates] = useState<ExtractedPdfIdea[]>([]);
  const [extractedPageCount, setExtractedPageCount] = useState(0);
  const [attachOriginalPdf, setAttachOriginalPdf] = useState(true);
  const [manualError, setManualError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingIdea) {
      setActiveTab('manual');
      setTitle(editingIdea.title);
      setDetails(editingIdea.details);
      setImageDataUrl(editingIdea.attachment?.imageDataUrl);
      setImageName(editingIdea.attachment?.imageName);
      setPdfDataUrl(editingIdea.attachment?.pdfDataUrl);
      setPdfName(editingIdea.attachment?.pdfName);
    } else {
      setActiveTab('manual');
      setTitle('');
      setDetails('');
      setImageDataUrl(undefined);
      setImageName(undefined);
      setPdfDataUrl(undefined);
      setPdfName(undefined);
      setExtractedCandidates([]);
      setExtractedPageCount(0);
      setPdfError('');
      setManualError('');
      setAttachOriginalPdf(true);
    }
  }, [isOpen, editingIdea]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageDataUrl(dataUrl);
      setImageName(file.name);
    } catch {
      setManualError('تعذر قراءة الصورة المختارة.');
    }
  };

  const handleManualPdfAttachment = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPdfDataUrl(dataUrl);
      setPdfName(file.name);
    } catch {
      setManualError('تعذر قراءة ملف PDF.');
    }
  };

  const handleExtractPdfUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    setPdfError('');
    try {
      const [result, rawPdfDataUrl] = await Promise.all([
        extractIdeasFromPdf(file),
        readFileAsDataUrl(file),
      ]);
      setPdfDataUrl(rawPdfDataUrl);
      setPdfName(file.name);
      setExtractedPageCount(result.pageCount);
      setExtractedCandidates(result.candidates);
    } catch {
      setPdfError('تعذر استخراج النصوص من ملف PDF. تأكد من سلامة الملف.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setManualError('الرجاء كتابة عنوان الفكرة.');
      return;
    }
    if (!details.trim() && !imageDataUrl && !pdfDataUrl) {
      setManualError('الرجاء كتابة تفاصيل/سيناريو الفكرة أو إرفاق صورة أو ملف PDF.');
      return;
    }

    const attachment: IdeaAttachment | undefined =
      imageDataUrl || pdfDataUrl
        ? {
            imageDataUrl,
            imageName,
            pdfDataUrl,
            pdfName,
          }
        : undefined;

    onSaveManual({
      title: title.trim(),
      details: details.trim(),
      attachment,
      sourceType: editingIdea?.sourceType ?? 'manual',
    });
    onClose();
  };

  const handleBatchPdfSave = () => {
    const selected = extractedCandidates.filter((item) => item.selected && item.title.trim());
    if (selected.length === 0) {
      setPdfError('اختر فكرة واحدة على الأقل للإضافة.');
      return;
    }

    const sharedAttachment: IdeaAttachment | undefined =
      attachOriginalPdf && pdfDataUrl
        ? {
            pdfDataUrl,
            pdfName,
          }
        : undefined;

    onSaveBatchFromPdf(
      selected.map((item) => ({
        title: item.title.trim(),
        details: item.details.trim(),
        attachment: sharedAttachment,
      })),
    );
    onClose();
  };

  const toggleCandidate = (id: string) => {
    setExtractedCandidates((prev) =>
      prev.map((c) => (c.id === id ? {...c, selected: !c.selected} : c)),
    );
  };

  const updateCandidate = (id: string, field: 'title' | 'details', value: string) => {
    setExtractedCandidates((prev) =>
      prev.map((c) => (c.id === id ? {...c, [field]: value} : c)),
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-idea-modal-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#07162E]/70 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#C7DCFA] bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[#D7E6FD] bg-[#F4F8FF] px-6 py-4">
          <div>
            <h2 id="add-idea-modal-title" className="font-display text-lg font-bold text-[#0B1F3A]">
              {editingIdea ? 'تعديل الفكرة' : `إضافة فكرة إلى: ${sectionTitle}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-xl p-1.5 text-[#3B5A85] hover:bg-[#DBEAFE] hover:text-[#0B1F3A] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs (Hidden when editing an existing idea) */}
        {!editingIdea && (
          <div className="border-b border-[#D7E6FD] bg-white px-6 py-3">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#EAF2FF] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`min-h-[40px] rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#1E40AF] hover:bg-white/60'
                }`}
              >
                إضافة فكرة يدوياً + صورة
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('pdf')}
                className={`min-h-[40px] rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === 'pdf'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#1E40AF] hover:bg-white/60'
                }`}
              >
                رفع PDF واستخراج الأفكار
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'manual' ? (
            <form id="manual-idea-form" onSubmit={handleManualSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A] mb-1.5">
                  عنوان الفكرة
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (manualError) setManualError('');
                  }}
                  placeholder="اكتب عنواناً واضحاً للفكرة..."
                  className="w-full rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-4 py-2.5 text-sm text-[#0B1F3A] placeholder:text-[#60A5FA] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A] mb-1.5">
                  تفاصيل / سيناريو الفكرة
                </label>
                <textarea
                  rows={5}
                  value={details}
                  onChange={(e) => {
                    setDetails(e.target.value);
                    if (manualError) setManualError('');
                  }}
                  placeholder="اكتب تفاصيل الفكرة أو السيناريو أو المشاهد المقترحة..."
                  className="w-full rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-4 py-3 text-sm leading-relaxed text-[#0B1F3A] placeholder:text-[#60A5FA] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Image & PDF Attachment Uploaders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Image Upload */}
                <div className="rounded-xl border border-dashed border-[#93C5FD] bg-[#F4F8FF] p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#0B1F3A]">صورة توضيحية (من الجهاز)</span>
                    {imageDataUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageDataUrl(undefined);
                          setImageName(undefined);
                        }}
                        className="text-xs font-medium text-[#1D4ED8] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>إزالة</span>
                      </button>
                    )}
                  </div>

                  {imageDataUrl ? (
                    <div className="space-y-2">
                      <img
                        src={imageDataUrl}
                        alt={imageName ?? 'صورة الفكرة'}
                        className="h-28 w-full rounded-lg object-cover border border-[#BFDBFE]"
                      />
                      <p className="text-[11px] text-[#3B5A85] truncate">{imageName}</p>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 py-4 text-center cursor-pointer hover:bg-[#EAF2FF] rounded-lg transition-colors">
                      <ImagePlus className="h-6 w-6 text-[#2563EB]" />
                      <span className="text-xs font-medium text-[#1D4ED8]">اختيار صورة من الجهاز</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Optional PDF Attachment */}
                <div className="rounded-xl border border-dashed border-[#93C5FD] bg-[#F4F8FF] p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#0B1F3A]">ملف PDF مرفق (اختياري)</span>
                    {pdfDataUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPdfDataUrl(undefined);
                          setPdfName(undefined);
                        }}
                        className="text-xs font-medium text-[#1D4ED8] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>إزالة</span>
                      </button>
                    )}
                  </div>

                  {pdfDataUrl ? (
                    <div className="flex items-center gap-2.5 rounded-lg border border-[#BFDBFE] bg-white p-3">
                      <FileText className="h-6 w-6 text-[#2563EB] shrink-0" />
                      <span className="text-xs font-medium text-[#0B1F3A] truncate">{pdfName}</span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 py-4 text-center cursor-pointer hover:bg-[#EAF2FF] rounded-lg transition-colors">
                      <FileText className="h-6 w-6 text-[#2563EB]" />
                      <span className="text-xs font-medium text-[#1D4ED8]">إرفاق ملف PDF</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleManualPdfAttachment}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {manualError && (
                <p role="alert" className="text-xs font-semibold text-[#1D4ED8]">
                  {manualError}
                </p>
              )}
            </form>
          ) : (
            <div className="space-y-5">
              {/* Upload PDF Zone */}
              <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#60A5FA] bg-[#F4F8FF] px-6 py-8 text-center transition-colors hover:bg-[#EAF2FF] cursor-pointer">
                {isExtracting ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
                    <span className="text-sm font-semibold text-[#0B1F3A]">
                      جاري قراءة ملف PDF واستخراج الأفكار...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB] text-white">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0B1F3A]">
                        اضغط لاختيار ملف PDF من جهازك
                      </p>
                      <p className="mt-1 text-xs text-[#3B5A85]">
                        سيتم استخراج النصوص وتقسيمها تلقائياً إلى أفكار جاهزة للمراجعة والإضافة
                      </p>
                    </div>
                  </>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleExtractPdfUpload}
                  className="hidden"
                />
              </label>

              {pdfError && (
                <p role="alert" className="text-xs font-semibold text-[#1D4ED8]">
                  {pdfError}
                </p>
              )}

              {/* Extracted Candidates Review List */}
              {extractedCandidates.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D7E6FD] pb-3">
                    <div className="text-xs font-semibold text-[#0B1F3A]">
                      <span>الملف: {pdfName}</span>
                      <span className="mx-2 text-[#60A5FA]">·</span>
                      <span className="tabular-nums">{extractedPageCount} صفحات</span>
                      <span className="mx-2 text-[#60A5FA]">·</span>
                      <span className="tabular-nums">
                        تم استخراج {extractedCandidates.length} فكرة
                      </span>
                    </div>

                    <label className="inline-flex items-center gap-2 text-xs font-medium text-[#1E40AF] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachOriginalPdf}
                        onChange={(e) => setAttachOriginalPdf(e.target.checked)}
                        className="h-4 w-4 rounded border-[#93C5FD] text-[#2563EB]"
                      />
                      <span>إرفاق ملف PDF الأصلي مع الأفكار للمسؤول</span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    {extractedCandidates.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-4 transition-colors ${
                          item.selected
                            ? 'border-[#2563EB] bg-[#F4F8FF]'
                            : 'border-[#D7E6FD] bg-white opacity-70'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleCandidate(item.id)}
                            aria-label={item.selected ? 'إلغاء تحديد الفكرة' : 'تحديد الفكرة'}
                            className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer ${
                              item.selected
                                ? 'border-[#2563EB] bg-[#2563EB] text-white'
                                : 'border-[#93C5FD] bg-white'
                            }`}
                          >
                            {item.selected && <Check className="h-3.5 w-3.5" />}
                          </button>

                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-[#2563EB] tabular-nums">
                                فكرة مستخرجة #{idx + 1}
                              </span>
                            </div>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateCandidate(item.id, 'title', e.target.value)}
                              className="w-full rounded-lg border border-[#C7DCFA] bg-white px-3 py-1.5 text-sm font-semibold text-[#0B1F3A] focus:border-[#2563EB] focus:outline-none"
                            />
                            <textarea
                              rows={3}
                              value={item.details}
                              onChange={(e) => updateCandidate(item.id, 'details', e.target.value)}
                              className="w-full rounded-lg border border-[#C7DCFA] bg-white px-3 py-2 text-xs leading-relaxed text-[#3B5A85] focus:border-[#2563EB] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#D7E6FD] bg-[#F4F8FF] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] rounded-xl border border-[#C7DCFA] bg-white px-4 py-2 text-sm font-semibold text-[#3B5A85] hover:bg-[#EAF2FF] cursor-pointer"
          >
            إلغاء
          </button>

          {activeTab === 'manual' ? (
            <button
              type="submit"
              form="manual-idea-form"
              className="min-h-[42px] rounded-xl bg-[#2563EB] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] cursor-pointer"
            >
              {editingIdea ? 'حفظ التعديلات' : 'إضافة الفكرة'}
            </button>
          ) : (
            <button
              type="button"
              disabled={extractedCandidates.filter((c) => c.selected).length === 0}
              onClick={handleBatchPdfSave}
              className="min-h-[42px] rounded-xl bg-[#2563EB] px-6 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              إضافة الأفكار المحددة ({extractedCandidates.filter((c) => c.selected).length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
