import {ChevronLeft, Cloud, Eye, KeyRound} from 'lucide-react';
import {APP_LOGO_PATH} from '../constants';
import type {SectionConfig, UserRole} from '../types';

interface HeaderProps {
  role: UserRole;
  activeSection: SectionConfig | null;
  cloudEnabled: boolean;
  onGoHome: () => void;
  onOpenCloudSync: () => void;
  onOpenManagerAccess: () => void;
  onSwitchToReviewer: () => void;
}

export function Header({
  role,
  activeSection,
  cloudEnabled,
  onGoHome,
  onOpenCloudSync,
  onOpenManagerAccess,
  onSwitchToReviewer,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#C7DCFA] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* Brand mark & contextual breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-3 text-right focus-visible:outline-2 focus-visible:outline-[#2563EB] rounded-xl cursor-pointer shrink-0"
          >
            <img
              src={APP_LOGO_PATH}
              alt="شعار أفكار"
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-xl border border-[#BFDBFE] object-cover bg-[#09152B]"
            />
            <span className="font-display text-lg font-extrabold text-[#0B1F3A] whitespace-nowrap">
              أفكار
            </span>
          </button>

          {activeSection && (
            <nav aria-label="مسار التنقل" className="hidden sm:flex items-center gap-2 text-sm text-[#3B5A85] min-w-0">
              <ChevronLeft className="h-4 w-4 text-[#60A5FA] shrink-0" />
              <button
                type="button"
                onClick={onGoHome}
                className="hover:text-[#1D4ED8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                الأقسام الخمسة
              </button>
              <ChevronLeft className="h-4 w-4 text-[#60A5FA] shrink-0" />
              <span className="font-semibold text-[#0B1F3A] truncate max-w-[240px]">
                {activeSection.title}
              </span>
            </nav>
          )}
        </div>

        {/* Corner Role Switcher & Cloud Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {role === 'manager' ? (
            <>
              <button
                type="button"
                onClick={onOpenCloudSync}
                className="inline-flex items-center gap-2 min-h-[38px] rounded-xl border border-[#BFDBFE] bg-[#EAF2FF] px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] transition-colors hover:bg-[#DBEAFE] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Cloud className="h-4 w-4 shrink-0" />
                <span>{cloudEnabled ? 'السحابة مفعّلة' : 'ربط السحابة'}</span>
              </button>

              <button
                type="button"
                onClick={onSwitchToReviewer}
                className="inline-flex items-center gap-1.5 min-h-[38px] rounded-xl border border-[#C7DCFA] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] transition-colors hover:bg-[#EAF2FF] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 shrink-0" />
                <span>عرض المسؤول</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenManagerAccess}
              className="inline-flex items-center gap-1.5 min-h-[36px] rounded-xl border border-[#D7E6FD] bg-[#F4F8FF] px-3 py-1.5 text-xs font-medium text-[#3B5A85] transition-colors hover:border-[#93C5FD] hover:bg-[#EAF2FF] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5 shrink-0" />
              <span>دخول المبرمج</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
