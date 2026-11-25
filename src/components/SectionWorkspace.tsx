import {useMemo, useState} from 'react';
import {ArrowRight, Plus, Search} from 'lucide-react';
import type {
  IdeaAttachment,
  IdeaItem,
  IdeaSentiment,
  SectionConfig,
  UserRole,
} from '../types';
import {AddIdeaModal} from './AddIdeaModal';
import {IdeaCard} from './IdeaCard';
import type {ActiveMediaPreview} from './MediaViewerModal';

interface SectionWorkspaceProps {
  section: SectionConfig;
  allSections: SectionConfig[];
  ideas: IdeaItem[];
  role: UserRole;
  onBack: () => void;
  onSwitchSection: (sectionId: string) => void;
  onAddManualIdea: (
    sectionId: string,
    data: {
      title: string;
      details: string;
      attachment?: IdeaAttachment;
      sourceType: 'manual' | 'pdf';
    },
  ) => void;
  onAddBatchIdeas: (
    sectionId: string,
    items: Array<{title: string; details: string; attachment?: IdeaAttachment}>,
  ) => void;
  onEditIdea: (
    ideaId: string,
    updates: {
      title: string;
      details: string;
      attachment?: IdeaAttachment;
    },
  ) => void;
  onDeleteIdea: (ideaId: string) => void;
  onRateIdea: (ideaId: string, rating: number) => void;
  onSetSentiment: (ideaId: string, sentiment: IdeaSentiment) => void;
  onApproveIdea: (ideaId: string) => void;
  onUnapproveIdea: (ideaId: string) => void;
  onPreviewMedia: (media: ActiveMediaPreview) => void;
}

type RatingFilter = 'all' | 'positive' | 'negative' | '5' | '4plus';

export function SectionWorkspace({
  section,
  allSections,
  ideas,
  role,
  onBack,
  onSwitchSection,
  onAddManualIdea,
  onAddBatchIdeas,
  onEditIdea,
  onDeleteIdea,
  onRateIdea,
  onSetSentiment,
  onApproveIdea,
  onUnapproveIdea,
  onPreviewMedia,
}: SectionWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<IdeaItem | null>(null);

  const isApprovedView = Boolean(section.isApprovedSection);

  const sectionIdeas = useMemo(() => {
    const base = isApprovedView
      ? ideas.filter((idea) => idea.approved)
      : ideas.filter((idea) => !idea.approved && idea.sectionId === section.id);

    const q = searchQuery.trim().toLowerCase();
    return base
      .filter((idea) => {
        if (q) {
          const matchTitle = idea.title.toLowerCase().includes(q);
          const matchDetails = idea.details.toLowerCase().includes(q);
          if (!matchTitle && !matchDetails) return false;
        }
        if (ratingFilter === 'positive') return idea.sentiment === 'positive';
        if (ratingFilter === 'negative') return idea.sentiment === 'negative';
        if (ratingFilter === '5') return idea.rating === 5;
        if (ratingFilter === '4plus') return idea.rating >= 4;
        return true;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [ideas, isApprovedView, section.id, searchQuery, ratingFilter]);

  const handleOpenAdd = () => {
    setEditingIdea(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (idea: IdeaItem) => {
    setEditingIdea(idea);
    setIsAddModalOpen(true);
  };

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      {/* Quick 5-Cubes Switcher Strip */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[40px] rounded-xl border border-[#C7DCFA] bg-white px-3.5 py-2 text-xs font-semibold text-[#0B1F3A] hover:bg-[#EAF2FF] hover:text-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowRight className="h-4 w-4" />
          <span>كل الأقسام</span>
        </button>

        <div className="h-5 w-px bg-[#C7DCFA] shrink-0 mx-1" aria-hidden="true" />

        {allSections.map((sec) => {
          const active = sec.id === section.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSwitchSection(sec.id)}
              className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-[#1D4ED8] text-white shadow-xs'
                  : 'border border-[#D7E6FD] bg-white text-[#3B5A85] hover:bg-[#EAF2FF] hover:text-[#1D4ED8]'
              }`}
            >
              {sec.title}
            </button>
          );
        })}
      </div>

      {/* Section Heading & Primary Add Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D7E6FD] pb-5 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
            {section.title}
          </h1>
          {section.subtitle && (
            <p className="mt-1 text-sm text-[#3B5A85]">{section.subtitle}</p>
          )}
        </div>

        {!isApprovedView && role === 'manager' && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 min-h-[44px] rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1D4ED8] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>إضافة فكرة / استيراد PDF</span>
          </button>
        )}
      </div>

      {/* Search & Rating Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#60A5FA]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث داخل أفكار هذا القسم..."
            className="w-full min-h-[42px] rounded-xl border border-[#C7DCFA] bg-white pr-10 pl-4 py-2 text-sm text-[#0B1F3A] placeholder:text-[#60A5FA] focus:border-[#2563EB] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[#C7DCFA] bg-white p-1">
          {(
            [
              {key: 'all', label: 'الكل'},
              {key: 'positive', label: 'إيجابي'},
              {key: 'negative', label: 'سلبي'},
              {key: '5', label: '٥ نجوم'},
              {key: '4plus', label: '٤+ نجوم'},
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRatingFilter(tab.key)}
              className={`min-h-[34px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                ratingFilter === tab.key
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#3B5A85] hover:bg-[#EAF2FF] hover:text-[#1D4ED8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas Grid or Empty State */}
      {sectionIdeas.length === 0 ? (
        <div className="rounded-2xl border border-[#C7DCFA] bg-white px-6 py-16 text-center">
          <p className="font-display text-lg font-bold text-[#0B1F3A]">
            {searchQuery || ratingFilter !== 'all'
              ? 'لا توجد أفكار مطابقة للبحث أو التصفية'
              : isApprovedView
                ? 'لا توجد أفكار معتمدة بعد'
                : 'لا توجد أفكار مضافة في هذا القسم بعد'}
          </p>
          <p className="mt-2 text-sm text-[#3B5A85] max-w-md mx-auto">
            {isApprovedView
              ? 'عند الضغط على زر "تم الاعتماد" لأي فكرة في الأقسام الأربعة الأولى، ستظهر هنا تلقائياً.'
              : role === 'manager'
                ? 'ابدأ بإضافة فكرة يدوياً مع صورة أو برفع ملف PDF لاستخراج الأفكار وعرضها للمسؤول.'
                : 'بانتظار قيام المدير بإضافة الأفكار ليتم استعراضها وتقييمها واعتمادها هنا.'}
          </p>
          {!isApprovedView && role === 'manager' && !searchQuery && ratingFilter === 'all' && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-6 inline-flex items-center gap-2 min-h-[44px] rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              <Plus className="h-5 w-5" />
              <span>إضافة أول فكرة</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sectionIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              sections={allSections}
              role={role}
              isApprovedView={isApprovedView}
              onRate={onRateIdea}
              onSetSentiment={onSetSentiment}
              onApprove={onApproveIdea}
              onUnapprove={onUnapproveIdea}
              onEdit={handleOpenEdit}
              onDelete={onDeleteIdea}
              onPreviewMedia={onPreviewMedia}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Idea Modal */}
      <AddIdeaModal
        isOpen={isAddModalOpen}
        sectionTitle={section.title}
        editingIdea={editingIdea}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingIdea(null);
        }}
        onSaveManual={(data) => {
          if (editingIdea) {
            onEditIdea(editingIdea.id, {
              title: data.title,
              details: data.details,
              attachment: data.attachment,
            });
          } else {
            onAddManualIdea(section.id, data);
          }
        }}
        onSaveBatchFromPdf={(items) => {
          onAddBatchIdeas(section.id, items);
        }}
      />
    </section>
  );
}
