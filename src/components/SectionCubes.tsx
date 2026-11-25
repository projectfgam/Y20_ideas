import {useState, type ChangeEvent} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clapperboard,
  Compass,
  Edit3,
  ImagePlus,
  Lightbulb,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import {BLUE_SHADE_STYLES} from '../constants';
import {readFileAsDataUrl} from '../services/pdfExtractor';
import type {BlueShadeKey, IdeaItem, SectionConfig, UserRole} from '../types';

interface SectionCubesProps {
  sections: SectionConfig[];
  ideas: IdeaItem[];
  role: UserRole;
  onSelectSection: (sectionId: string) => void;
  onUpdateSection: (sectionId: string, updates: Partial<SectionConfig>) => void;
  onMoveSection: (sectionId: string, direction: 'prev' | 'next') => void;
  onResetSections: () => void;
}

function getSectionIcon(section: SectionConfig) {
  if (section.isApprovedSection) return CheckCircle2;
  switch (section.id) {
    case 'tiktok-ideas':
      return Video;
    case 'bilkhibra-ideas':
      return Lightbulb;
    case 'documentary-scenes':
      return Clapperboard;
    case 'external-ideas':
      return Compass;
    default:
      return Sparkles;
  }
}

export function SectionCubes({
  sections,
  ideas,
  role,
  onSelectSection,
  onUpdateSection,
  onMoveSection,
  onResetSections,
}: SectionCubesProps) {
  const [editingSection, setEditingSection] = useState<SectionConfig | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editShade, setEditShade] = useState<BlueShadeKey>('azure');
  const [editCoverImageDataUrl, setEditCoverImageDataUrl] = useState<string | undefined>(
    undefined,
  );
  const [editCoverImageName, setEditCoverImageName] = useState<string | undefined>(
    undefined,
  );
  const [imageUploadError, setImageUploadError] = useState('');

  const openEditor = (section: SectionConfig) => {
    setEditingSection(section);
    setEditTitle(section.title);
    setEditSubtitle(section.subtitle);
    setEditShade(section.shade);
    setEditCoverImageDataUrl(section.coverImageDataUrl);
    setEditCoverImageName(section.coverImageName);
    setImageUploadError('');
  };

  const handleCoverImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditCoverImageDataUrl(dataUrl);
      setEditCoverImageName(file.name);
      setImageUploadError('');
    } catch {
      setImageUploadError('تعذر قراءة الصورة المختارة.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveEdit = () => {
    if (!editingSection) return;
    const cleanTitle = editTitle.trim();
    if (!cleanTitle) return;
    onUpdateSection(editingSection.id, {
      title: cleanTitle,
      subtitle: editSubtitle.trim(),
      shade: editShade,
      coverImageDataUrl: editCoverImageDataUrl,
      coverImageName: editCoverImageName,
    });
    setEditingSection(null);
  };

  const getCountForSection = (section: SectionConfig) => {
    if (section.isApprovedSection) {
      return ideas.filter((i) => i.approved).length;
    }
    return ideas.filter((i) => !i.approved && i.sectionId === section.id).length;
  };

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
            أقسام الأفكار
          </h1>
          <p className="mt-1 text-sm text-[#3B5A85]">
            {role === 'manager'
              ? 'اختر قسماً لإضافة الأفكار والملفات، أو خصّص المكعبات كما يناسبك'
              : 'اختر أي قسم لاستعراض الأفكار وتقييمها واعتمادها'}
          </p>
        </div>

        {role === 'manager' && (
          <button
            type="button"
            onClick={onResetSections}
            className="inline-flex items-center gap-2 min-h-[40px] rounded-xl border border-[#C7DCFA] bg-white px-4 py-2 text-xs font-semibold text-[#1D4ED8] transition-colors hover:bg-[#EAF2FF] whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>استعادة أسماء وترتيب الأقسام الافتراضي</span>
          </button>
        )}
      </div>

      {/* Interactive 5 Blue Cubes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, index) => {
          const style = BLUE_SHADE_STYLES[section.shade] ?? BLUE_SHADE_STYLES.azure;
          const Icon = getSectionIcon(section);
          const count = getCountForSection(section);

          return (
            <div
              key={section.id}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border ${style.cubeBorder} bg-gradient-to-br ${style.cubeBg} text-white shadow-lg shadow-[#1E40AF]/15 transition-transform duration-200 hover:-translate-y-1`}
            >
              {/* Optional Section Cover Image with Measured Blue Scrim */}
              {section.coverImageDataUrl && (
                <>
                  <img
                    src={section.coverImageDataUrl}
                    alt={section.coverImageName ?? section.title}
                    referrerPolicy="no-referrer"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.cubeBg} opacity-75`}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#06142B]/90 via-[#0B2247]/45 to-transparent"
                  />
                </>
              )}

              {/* Top 3D cube bevel edge */}
              <div aria-hidden="true" className={`relative z-10 h-2 w-full ${style.cubeTopBevel}`} />

              {/* Main clickable cube area */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectSection(section.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSection(section.id);
                  }
                }}
                className="relative z-10 flex flex-1 flex-col justify-between p-6 text-right focus-visible:outline-2 focus-visible:outline-white cursor-pointer min-h-[210px]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.iconBg} backdrop-blur-xs`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-mono tabular-nums text-2xl font-bold text-white/95">
                    {count}
                  </span>
                </div>

                <div className="mt-6">
                  <h2 className="font-display text-xl font-bold leading-snug text-white">
                    {section.title}
                  </h2>
                  {section.subtitle && (
                    <p className="mt-1.5 text-sm text-[#DBEAFE]/90 line-clamp-2">
                      {section.subtitle}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between text-xs font-medium text-[#DBEAFE]">
                  <span>{count === 0 ? 'لا توجد أفكار بعد' : `${count} أفكار`}</span>
                  <span className="inline-flex items-center gap-1 transition-transform group-hover:-translate-x-1">
                    <span>فتح القسم</span>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>

              {/* Manager Cube Customization Toolbar */}
              {role === 'manager' && (
                <div className={`relative z-10 flex items-center justify-between gap-2 px-4 py-2.5 border-t border-white/15 backdrop-blur-xs ${style.cubeBottomBevel}`}>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveSection(section.id, 'prev');
                      }}
                      aria-label="تقديم القسم"
                      className="p-1.5 rounded-lg text-[#DBEAFE] hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sections.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveSection(section.id, 'next');
                      }}
                      aria-label="تأخير القسم"
                      className="p-1.5 rounded-lg text-[#DBEAFE] hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditor(section);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>تخصيص المكعب</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Customize Cube Modal (Manager Only) */}
      {editingSection && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customize-cube-title"
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#07162E]/65 p-4 backdrop-blur-xs"
        >
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#C7DCFA] bg-white shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#D7E6FD] bg-[#F4F8FF] px-6 py-4">
              <h3 id="customize-cube-title" className="font-display text-lg font-bold text-[#0B1F3A]">
                تخصيص المكعب
              </h3>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                aria-label="إغلاق"
                className="rounded-lg p-1.5 text-[#3B5A85] hover:bg-[#EAF2FF] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A] mb-1.5">
                  اسم القسم
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-3.5 py-2.5 text-sm text-[#0B1F3A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F3A] mb-1.5">
                  وصف مختصر
                </label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] px-3.5 py-2.5 text-sm text-[#0B1F3A] focus:border-[#2563EB] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#0B1F3A] mb-2">
                  درجة اللون الأزرق للمكعب
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(BLUE_SHADE_STYLES) as BlueShadeKey[]).map((key) => {
                    const shadeInfo = BLUE_SHADE_STYLES[key];
                    const selected = editShade === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditShade(key)}
                        title={shadeInfo.label}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all cursor-pointer ${
                          selected
                            ? 'border-[#2563EB] bg-[#EAF2FF] ring-2 ring-[#2563EB]/30'
                            : 'border-[#D7E6FD] bg-white hover:bg-[#F4F8FF]'
                        }`}
                      >
                        <span
                          className="h-6 w-6 rounded-lg border border-white/40 shadow-xs"
                          style={{backgroundColor: shadeInfo.swatch}}
                        />
                        <span className="text-[10px] font-medium text-[#0B1F3A] truncate max-w-full">
                          {shadeInfo.label.replace('أزرق ', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section General Cover Image Upload */}
              <div>
                <span className="block text-xs font-semibold text-[#0B1F3A] mb-2">
                  صورة القسم العامة
                </span>

                {editCoverImageDataUrl ? (
                  <div className="rounded-xl border border-[#C7DCFA] bg-[#F4F8FF] p-3 space-y-3">
                    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[#BFDBFE]">
                      <img
                        src={editCoverImageDataUrl}
                        alt={editCoverImageName ?? 'صورة القسم'}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <div
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${
                          (BLUE_SHADE_STYLES[editShade] ?? BLUE_SHADE_STYLES.azure).cubeBg
                        } opacity-45`}
                      />
                    </div>

                    {editCoverImageName && (
                      <p className="text-[11px] font-medium text-[#3B5A85] truncate">
                        {editCoverImageName}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <label className="inline-flex items-center justify-center gap-1.5 min-h-[38px] rounded-lg border border-[#BFDBFE] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D4ED8] hover:bg-[#EAF2FF] transition-colors cursor-pointer">
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>استبدال الصورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageChange}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setEditCoverImageDataUrl(undefined);
                          setEditCoverImageName(undefined);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[38px] rounded-lg border border-[#C7DCFA] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F294D] hover:bg-[#DBEAFE] transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>حذف الصورة</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 min-h-[46px] w-full rounded-xl border border-dashed border-[#60A5FA] bg-[#F4F8FF] px-4 py-3 text-xs font-semibold text-[#1D4ED8] hover:bg-[#EAF2FF] transition-colors cursor-pointer">
                    <ImagePlus className="h-4 w-4 shrink-0" />
                    <span>اختر صورة للقسم</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="hidden"
                    />
                  </label>
                )}

                {imageUploadError && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-[#1D4ED8]">
                    {imageUploadError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#D7E6FD] bg-[#F4F8FF] px-6 py-4">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="min-h-[42px] rounded-xl border border-[#C7DCFA] bg-white px-4 py-2 text-sm font-semibold text-[#3B5A85] hover:bg-[#EAF2FF] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="min-h-[42px] rounded-xl bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] cursor-pointer"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
