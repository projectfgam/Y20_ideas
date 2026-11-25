import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {CheckCircle2} from 'lucide-react';
import {CloudSyncModal} from './components/CloudSyncModal';
import {Header} from './components/Header';
import {ManagerAccessModal} from './components/ManagerAccessModal';
import {
  MediaViewerModal,
  type ActiveMediaPreview,
} from './components/MediaViewerModal';
import {SectionCubes} from './components/SectionCubes';
import {SectionWorkspace} from './components/SectionWorkspace';
import {SplashScreen} from './components/SplashScreen';
import {APPROVED_SECTION_ID, DEFAULT_SECTIONS} from './constants';
import {
  DEFAULT_CLOUD_CONFIG,
  hasCloudTarget,
  loadCloudConfig,
  loadLocalSnapshot,
  loadSavedRole,
  pullSnapshotFromCloud,
  pushSnapshotToCloud,
  saveCloudConfig,
  saveLocalSnapshot,
  saveRole,
} from './services/storage';
import type {
  AppSnapshot,
  CloudSyncConfig,
  IdeaAttachment,
  IdeaItem,
  IdeaSentiment,
  SectionConfig,
  UserRole,
} from './types';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashExiting, setSplashExiting] = useState(false);

  const [role, setRole] = useState<UserRole>(() => loadSavedRole());
  const [snapshot, setSnapshot] = useState<AppSnapshot>({
    version: 1,
    updatedAt: Date.now(),
    sections: DEFAULT_SECTIONS,
    ideas: [],
  });
  const [hydrated, setHydrated] = useState(false);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [cloudConfig, setCloudConfig] = useState<CloudSyncConfig>(() =>
    loadCloudConfig(),
  );
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isManagerAccessOpen, setIsManagerAccessOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<ActiveMediaPreview | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  const triggerToast = useCallback(
    (text: string, actionLabel?: string, onAction?: () => void) => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      setToastMessage({text, actionLabel, onAction});
      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null);
      }, 4500);
    },
    [],
  );

  // Hydrate persisted state from IndexedDB/localStorage & run smooth splash transition
  useEffect(() => {
    let mounted = true;
    const minSplashDelay = new Promise((resolve) => setTimeout(resolve, 1600));

    Promise.all([loadLocalSnapshot(), minSplashDelay]).then(async ([localData]) => {
      if (!mounted) return;
      let resolvedData = localData;

      // If shared cloud database is configured, pull latest updates automatically
      const cfg = loadCloudConfig();
      if (cfg.enabled && hasCloudTarget(cfg)) {
        try {
          const remote = await pullSnapshotFromCloud(cfg);
          if (remote && remote.updatedAt > localData.updatedAt) {
            resolvedData = remote;
            await saveLocalSnapshot(remote);
          }
        } catch {
          // Keep local backup silently when offline
        }
      }

      if (!mounted) return;
      setSnapshot(resolvedData);
      setHydrated(true);

      // Smooth fade-out straight into the Reviewer cubes view
      setSplashExiting(true);
      setTimeout(() => {
        if (mounted) setShowSplash(false);
      }, 600);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Persist every snapshot change locally + sync to shared Cloud DB when configured
  const commitSnapshot = useCallback(
    (updater: (prev: AppSnapshot) => AppSnapshot) => {
      setSnapshot((prev) => {
        const next: AppSnapshot = {
          ...updater(prev),
          updatedAt: Date.now(),
        };
        void saveLocalSnapshot(next);

        if (cloudConfig.enabled && cloudConfig.autoSync && hasCloudTarget(cloudConfig)) {
          void pushSnapshotToCloud(next, cloudConfig).catch(() => {
            // Local backup already succeeded
          });
        }
        return next;
      });
    },
    [cloudConfig],
  );

  const handleEnterManager = () => {
    setRole('manager');
    saveRole('manager');
    triggerToast('تم تفعيل وضع المبرمج / المدير.');
  };

  const handleSwitchToReviewer = () => {
    setRole('guest');
    saveRole('guest');
    triggerToast('تم التبديل إلى عرض المسؤول.');
  };

  const handleUpdateSection = (
    sectionId: string,
    updates: Partial<SectionConfig>,
  ) => {
    commitSnapshot((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === sectionId ? {...sec, ...updates} : sec,
      ),
    }));
  };

  const handleMoveSection = (sectionId: string, direction: 'prev' | 'next') => {
    commitSnapshot((prev) => {
      const sorted = [...prev.sections].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === sectionId);
      if (idx === -1) return prev;
      const targetIdx = direction === 'prev' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sorted.length) return prev;

      const swapped = [...sorted];
      const temp = swapped[idx];
      swapped[idx] = swapped[targetIdx];
      swapped[targetIdx] = temp;

      return {
        ...prev,
        sections: swapped.map((s, i) => ({...s, order: i})),
      };
    });
  };

  const handleResetSections = () => {
    commitSnapshot((prev) => ({
      ...prev,
      sections: DEFAULT_SECTIONS,
    }));
    triggerToast('تمت استعادة الأسماء والترتيب الافتراضي للأقسام الخمسة.');
  };

  const handleAddManualIdea = (
    sectionId: string,
    data: {
      title: string;
      details: string;
      attachment?: IdeaAttachment;
      sourceType: 'manual' | 'pdf';
    },
  ) => {
    const now = Date.now();
    const newIdea: IdeaItem = {
      id: crypto.randomUUID(),
      sectionId,
      originalSectionId: sectionId,
      title: data.title,
      details: data.details,
      rating: 0,
      sentiment: null,
      approved: false,
      createdAt: now,
      updatedAt: now,
      sourceType: data.sourceType,
      attachment: data.attachment,
    };
    commitSnapshot((prev) => ({
      ...prev,
      ideas: [newIdea, ...prev.ideas],
    }));
    triggerToast('تمت إضافة الفكرة وحفظها.');
  };

  const handleAddBatchIdeas = (
    sectionId: string,
    items: Array<{title: string; details: string; attachment?: IdeaAttachment}>,
  ) => {
    const now = Date.now();
    const newIdeas: IdeaItem[] = items.map((item, idx) => ({
      id: crypto.randomUUID(),
      sectionId,
      originalSectionId: sectionId,
      title: item.title,
      details: item.details,
      rating: 0,
      sentiment: null,
      approved: false,
      createdAt: now + idx,
      updatedAt: now + idx,
      sourceType: 'pdf',
      attachment: item.attachment,
    }));
    commitSnapshot((prev) => ({
      ...prev,
      ideas: [...newIdeas, ...prev.ideas],
    }));
    triggerToast(`تم استيراد وإضافة ${newIdeas.length} فكرة من ملف PDF.`);
  };

  const handleEditIdea = (
    ideaId: string,
    updates: {title: string; details: string; attachment?: IdeaAttachment},
  ) => {
    commitSnapshot((prev) => ({
      ...prev,
      ideas: prev.ideas.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              title: updates.title,
              details: updates.details,
              attachment: updates.attachment,
              updatedAt: Date.now(),
            }
          : idea,
      ),
    }));
    triggerToast('تم تحديث الفكرة وحفظ التعديلات.');
  };

  const handleDeleteIdea = (ideaId: string) => {
    commitSnapshot((prev) => ({
      ...prev,
      ideas: prev.ideas.filter((idea) => idea.id !== ideaId),
    }));
    triggerToast('تم حذف الفكرة.');
  };

  const handleRateIdea = (ideaId: string, rating: number) => {
    commitSnapshot((prev) => ({
      ...prev,
      ideas: prev.ideas.map((idea) =>
        idea.id === ideaId
          ? {...idea, rating, updatedAt: Date.now()}
          : idea,
      ),
    }));
  };

  const handleSetSentiment = (ideaId: string, sentiment: IdeaSentiment) => {
    commitSnapshot((prev) => ({
      ...prev,
      ideas: prev.ideas.map((idea) =>
        idea.id === ideaId
          ? {...idea, sentiment, updatedAt: Date.now()}
          : idea,
      ),
    }));
  };

  const handleApproveIdea = (ideaId: string) => {
    const approvedSection = snapshot.sections.find((s) => s.isApprovedSection);
    const targetSectionId = approvedSection?.id ?? APPROVED_SECTION_ID;

    commitSnapshot((prev) => ({
      ...prev,
      ideas: prev.ideas.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              approved: true,
              approvedAt: Date.now(),
              sectionId: targetSectionId,
              updatedAt: Date.now(),
            }
          : idea,
      ),
    }));

    triggerToast(
      'تم اعتماد الفكرة ونقلها إلى قسم تم الاعتماد منكم.',
      'عرض تم الاعتماد منكم',
      () => setActiveSectionId(targetSectionId),
    );
  };

  const handleUnapproveIdea = (ideaId: string) => {
    commitSnapshot((prev) => ({
      ...prev,
      ideas: prev.ideas.map((idea) =>
        idea.id === ideaId
          ? {
              ...idea,
              approved: false,
              approvedAt: undefined,
              sectionId: idea.originalSectionId,
              updatedAt: Date.now(),
            }
          : idea,
      ),
    }));
    triggerToast('تمت إعادة الفكرة إلى قسمها الأصلي.');
  };

  const handleSaveCloudConfig = (nextConfig: CloudSyncConfig) => {
    setCloudConfig(nextConfig);
    saveCloudConfig(nextConfig);
  };

  const handlePushToCloud = async (cfg: CloudSyncConfig) => {
    await pushSnapshotToCloud(snapshot, cfg);
    const updatedCfg = {...cfg, lastSyncedAt: Date.now()};
    handleSaveCloudConfig(updatedCfg);
  };

  const handlePullFromCloud = async (cfg: CloudSyncConfig) => {
    const remote = await pullSnapshotFromCloud(cfg);
    if (!remote) return false;
    setSnapshot(remote);
    await saveLocalSnapshot(remote);
    handleSaveCloudConfig({...cfg, lastSyncedAt: Date.now()});
    return true;
  };

  const handleImportSnapshot = (imported: AppSnapshot) => {
    commitSnapshot(() => imported);
  };

  const sortedSections = useMemo(
    () => [...snapshot.sections].sort((a, b) => a.order - b.order),
    [snapshot.sections],
  );

  const activeSection = useMemo(
    () => sortedSections.find((s) => s.id === activeSectionId) ?? null,
    [sortedSections, activeSectionId],
  );

  return (
    <div className="min-h-screen bg-[#F4F8FF] text-[#0B1F3A]">
      {/* Splash Screen with gentle smooth pulse on the attached logo */}
      {showSplash && <SplashScreen exiting={splashExiting} />}

      {/* Direct Reviewer Interface once hydrated (no blocking login gate) */}
      {hydrated && (
        <>
          <div className="min-h-screen flex flex-col">
            <Header
              role={role}
              activeSection={activeSection}
              cloudEnabled={cloudConfig.enabled}
              onGoHome={() => setActiveSectionId(null)}
              onOpenCloudSync={() => setIsCloudModalOpen(true)}
              onOpenManagerAccess={() => setIsManagerAccessOpen(true)}
              onSwitchToReviewer={handleSwitchToReviewer}
            />

            <main className="flex-1">
              {!activeSection ? (
                <SectionCubes
                  sections={sortedSections}
                  ideas={snapshot.ideas}
                  role={role}
                  onSelectSection={(id) => setActiveSectionId(id)}
                  onUpdateSection={handleUpdateSection}
                  onMoveSection={handleMoveSection}
                  onResetSections={handleResetSections}
                />
              ) : (
                <SectionWorkspace
                  section={activeSection}
                  allSections={sortedSections}
                  ideas={snapshot.ideas}
                  role={role}
                  onBack={() => setActiveSectionId(null)}
                  onSwitchSection={(id) => setActiveSectionId(id)}
                  onAddManualIdea={handleAddManualIdea}
                  onAddBatchIdeas={handleAddBatchIdeas}
                  onEditIdea={handleEditIdea}
                  onDeleteIdea={handleDeleteIdea}
                  onRateIdea={handleRateIdea}
                  onSetSentiment={handleSetSentiment}
                  onApproveIdea={handleApproveIdea}
                  onUnapproveIdea={handleUnapproveIdea}
                  onPreviewMedia={(media) => setActiveMedia(media)}
                />
              )}
            </main>
          </div>

          {/* Modals */}
          <ManagerAccessModal
            isOpen={isManagerAccessOpen}
            onClose={() => setIsManagerAccessOpen(false)}
            onSuccess={handleEnterManager}
          />

          <MediaViewerModal
            media={activeMedia}
            onClose={() => setActiveMedia(null)}
          />

          <CloudSyncModal
            isOpen={isCloudModalOpen}
            config={cloudConfig ?? DEFAULT_CLOUD_CONFIG}
            snapshot={snapshot}
            onClose={() => setIsCloudModalOpen(false)}
            onSaveConfig={handleSaveCloudConfig}
            onPushToCloud={handlePushToCloud}
            onPullFromCloud={handlePullFromCloud}
            onImportSnapshot={handleImportSnapshot}
          />

          {/* Clean Blue Notification Toast */}
          {toastMessage && (
            <div
              role="status"
              aria-live="polite"
              className="fixed bottom-5 left-5 z-50 flex flex-wrap items-center gap-3 rounded-2xl border border-[#3B82F6]/40 bg-[#0F294D] px-5 py-3.5 text-sm font-medium text-white shadow-xl"
            >
              <CheckCircle2 className="h-5 w-5 text-[#60A5FA] shrink-0" />
              <span>{toastMessage.text}</span>
              {toastMessage.actionLabel && toastMessage.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toastMessage.onAction?.();
                    setToastMessage(null);
                  }}
                  className="rounded-lg bg-[#2563EB] px-3 py-1 text-xs font-bold text-white hover:bg-[#3B82F6] cursor-pointer"
                >
                  {toastMessage.actionLabel}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
