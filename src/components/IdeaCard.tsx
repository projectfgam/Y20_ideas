import {useState} from 'react';
import {
  CheckCircle2,
  Edit3,
  FileText,
  RotateCcw,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  ZoomIn,
} from 'lucide-react';
import type {IdeaItem, IdeaSentiment, SectionConfig, UserRole} from '../types';
import type {ActiveMediaPreview} from './MediaViewerModal';

interface IdeaCardProps {
  idea: IdeaItem;
  sections: SectionConfig[];
  role: UserRole;
  isApprovedView: boolean;
  onRate: (ideaId: string, rating: number) => void;
  onSetSentiment: (ideaId: string, sentiment: IdeaSentiment) => void;
  onApprove: (ideaId: string) => void;
  onUnapprove: (ideaId: string) => void;
  onEdit: (idea: IdeaItem) => void;
  onDelete: (ideaId: string) => void;
  onPreviewMedia: (media: ActiveMediaPreview) => void;
}

function formatArabicDate(timestamp: number): string {
  try {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleDateString();
  }
}

export function IdeaCard({
  idea,
  sections,
  role,
  isApprovedView,
  onRate,
  onSetSentiment,
  onApprove,
  onUnapprove,
  onEdit,
  onDelete,
  onPreviewMedia,
}: IdeaCardProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const originalSection = sections.find((s) => s.id === idea.originalSectionId);
  const displayedRating = hoverRating || idea.rating;

  const toggleSentiment = (value: 'positive' | 'negative') => {
    onSetSentiment(idea.id, idea.sentiment === value ? null : value);
  };

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-[#C7DCFA] bg-white p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-md hover:shadow-[#1D4ED8]/10">
      <div>
        {/* Clean Unboxed Metadata Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#3B5A85] mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tabular-nums">{formatArabicDate(idea.createdAt)}</span>
            {idea.sourceType === 'pdf' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#1D4ED8]">مستخرجة من PDF</span>
              </>
            )}
            {isApprovedView && originalSection && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#1E40AF]">
                  من قسم: {originalSection.title}
                </span>
              </>
            )}
          </div>

          {role === 'manager' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(idea)}
                aria-label="تعديل الفكرة"
                className="rounded-lg p-1.5 text-[#3B5A85] hover:bg-[#EAF2FF] hover:text-[#1D4ED8] cursor-pointer"
              >
                <Edit3 className="h-4 w-4" />
              </button>

              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDelete(idea.id)}
                    className="rounded-lg bg-[#0F294D] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1E40AF] cursor-pointer"
                  >
                    تأكيد الحذف
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg px-2 py-1 text-[11px] font-medium text-[#3B5A85] hover:bg-[#EAF2FF] cursor-pointer"
                  >
                    تراجع
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="حذف الفكرة"
                  className="rounded-lg p-1.5 text-[#3B5A85] hover:bg-[#EAF2FF] hover:text-[#0F294D] cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display text-lg font-bold text-[#0B1F3A] leading-snug">
          {idea.title}
        </h3>

        {/* Scenario / Details */}
        {idea.details && (
          <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-[#25406B]">
            {idea.details}
          </p>
        )}

        {/* Attachments (Image & PDF) */}
        {(idea.attachment?.imageDataUrl || idea.attachment?.pdfDataUrl) && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {idea.attachment.imageDataUrl && (
              <button
                type="button"
                onClick={() =>
                  onPreviewMedia({
                    type: 'image',
                    dataUrl: idea.attachment!.imageDataUrl!,
                    fileName: idea.attachment?.imageName ?? 'صورة الفكرة',
                    ideaTitle: idea.title,
                  })
                }
                className="group relative overflow-hidden rounded-xl border border-[#BFDBFE] bg-[#F4F8FF] cursor-pointer"
              >
                <img
                  src={idea.attachment.imageDataUrl}
                  alt={idea.attachment.imageName ?? idea.title}
                  referrerPolicy="no-referrer"
                  className="h-24 w-36 object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-[#0B1F3A]/75 px-2 py-0.5 text-[10px] font-medium text-white">
                  <ZoomIn className="h-3 w-3" />
                  <span>تكبير</span>
                </span>
              </button>
            )}

            {idea.attachment.pdfDataUrl && (
              <button
                type="button"
                onClick={() =>
                  onPreviewMedia({
                    type: 'pdf',
                    dataUrl: idea.attachment!.pdfDataUrl!,
                    fileName: idea.attachment?.pdfName ?? 'ملف PDF',
                    ideaTitle: idea.title,
                  })
                }
                className="inline-flex items-center gap-2.5 min-h-[44px] rounded-xl border border-[#BFDBFE] bg-[#EAF2FF] px-4 py-2 text-xs font-semibold text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE] cursor-pointer"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="max-w-[190px] truncate">
                  معاينة PDF: {idea.attachment.pdfName ?? 'المستند المرفق'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls: Quick Positive/Negative + 1-5 Star Rating + "تم الاعتماد" */}
      <div className="mt-5 space-y-3 border-t border-[#E6F0FD] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Positive / Negative Evaluation */}
          <div className="flex items-center gap-2" role="group" aria-label="تقييم سريع">
            <button
              type="button"
              onClick={() => toggleSentiment('positive')}
              aria-pressed={idea.sentiment === 'positive'}
              className={`inline-flex items-center gap-1.5 min-h-[38px] rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                idea.sentiment === 'positive'
                  ? 'border-[#2563EB] bg-[#2563EB] text-white shadow-xs'
                  : 'border-[#BFDBFE] bg-[#F4F8FF] text-[#1D4ED8] hover:bg-[#EAF2FF]'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>إيجابي</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSentiment('negative')}
              aria-pressed={idea.sentiment === 'negative'}
              className={`inline-flex items-center gap-1.5 min-h-[38px] rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                idea.sentiment === 'negative'
                  ? 'border-[#0F294D] bg-[#0F294D] text-white shadow-xs'
                  : 'border-[#C7DCFA] bg-[#F4F8FF] text-[#3B5A85] hover:bg-[#EAF2FF]'
              }`}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              <span>سلبي</span>
            </button>
          </div>

          {/* 1-5 Star Rating */}
          <div className="flex items-center gap-1.5">
            <div
              className="flex items-center gap-0.5"
              onMouseLeave={() => setHoverRating(0)}
              role="group"
              aria-label="تقييم الفكرة من ١ إلى ٥ نجوم"
            >
              {[1, 2, 3, 4, 5].map((starValue) => {
                const filled = starValue <= displayedRating;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onMouseEnter={() => setHoverRating(starValue)}
                    onClick={() => onRate(idea.id, starValue)}
                    aria-label={`تقييم ${starValue} من 5 نجوم`}
                    aria-pressed={idea.rating === starValue}
                    className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#2563EB] cursor-pointer"
                  >
                    <Star
                      className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                        filled
                          ? 'fill-[#2563EB] text-[#2563EB]'
                          : 'fill-[#EFF6FF] text-[#93C5FD]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <span className="font-mono tabular-nums text-xs font-semibold text-[#3B5A85]">
              {idea.rating}/5
            </span>
          </div>
        </div>

        {/* Prominent Approval Action */}
        <div className="flex items-center justify-end pt-1">
          {!idea.approved ? (
            <button
              type="button"
              onClick={() => onApprove(idea.id)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-[42px] rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-bold text-white shadow-xs transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>تم الاعتماد</span>
            </button>
          ) : (
            <div className="flex w-full items-center justify-between gap-2 rounded-xl bg-[#EAF2FF] px-3.5 py-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D4ED8]">
                <CheckCircle2 className="h-4 w-4" />
                <span>تم الاعتماد</span>
              </span>
              <button
                type="button"
                onClick={() => onUnapprove(idea.id)}
                className="inline-flex items-center gap-1.5 min-h-[34px] rounded-lg border border-[#BFDBFE] bg-white px-3 py-1 text-xs font-semibold text-[#1E40AF] hover:bg-[#DBEAFE] transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>إعادة للقسم</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
