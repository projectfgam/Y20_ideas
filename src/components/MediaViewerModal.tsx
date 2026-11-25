import {Download, FileText, Image as ImageIcon, X} from 'lucide-react';

export interface ActiveMediaPreview {
  type: 'image' | 'pdf';
  dataUrl: string;
  fileName: string;
  ideaTitle: string;
}

interface MediaViewerModalProps {
  media: ActiveMediaPreview | null;
  onClose: () => void;
}

export function MediaViewerModal({media, onClose}: MediaViewerModalProps) {
  if (!media) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`معاينة ${media.fileName}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#07162E]/80 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#3B82F6]/35 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#D7E6FD] bg-[#F4F8FF] px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {media.type === 'image' ? (
              <ImageIcon className="h-5 w-5 text-[#1D4ED8] shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-[#1D4ED8] shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-[#0B1F3A] truncate">
                {media.ideaTitle}
              </p>
              <p className="text-xs text-[#3B5A85] truncate">{media.fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={media.dataUrl}
              download={media.fileName}
              className="inline-flex items-center gap-1.5 min-h-[38px] rounded-xl bg-[#2563EB] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1D4ED8] transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>تنزيل</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق المعاينة"
              className="rounded-xl p-2 text-[#3B5A85] hover:bg-[#DBEAFE] hover:text-[#0B1F3A] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-[#EAF2FF] p-4 flex items-center justify-center">
          {media.type === 'image' ? (
            <img
              src={media.dataUrl}
              alt={media.fileName}
              referrerPolicy="no-referrer"
              className="max-h-[74vh] max-w-full rounded-xl object-contain shadow-md"
            />
          ) : (
            <iframe
              title={media.fileName}
              src={media.dataUrl}
              className="h-[74vh] w-full rounded-xl border border-[#C7DCFA] bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
}
