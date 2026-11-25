import type {BlueShadeKey, SectionConfig} from './types';

export const APP_LOGO_PATH = '/assets/aistudio/photo-output_bd6db191.jpeg';
export const MANAGER_SECRET_CODE = 'Y20';
export const APPROVED_SECTION_ID = 'approved-section';

export const DEFAULT_SECTIONS: SectionConfig[] = [
  {
    id: 'tiktok-ideas',
    title: 'أفكار للتيك توك',
    subtitle: 'مقاطع قصيرة سريعة الانتشار والتأثير',
    shade: 'azure',
    order: 0,
  },
  {
    id: 'bilkhibra-ideas',
    title: 'أفكار لبرنامج بالخبرة',
    subtitle: 'محاور وحلقات معرفية وتجارب عملية',
    shade: 'royal',
    order: 1,
  },
  {
    id: 'documentary-scenes',
    title: 'افكار مشاهد للفليم الوثائقي',
    subtitle: 'تصورات بصرية وسردية للمشاهد الوثائقية',
    shade: 'cobalt',
    order: 2,
  },
  {
    id: 'external-ideas',
    title: 'أفكار خارجيه',
    subtitle: 'مقترحات إبداعية ومشاريع مساندة',
    shade: 'sapphire',
    order: 3,
  },
  {
    id: APPROVED_SECTION_ID,
    title: 'تم الاعتماد منكم',
    subtitle: 'الأفكار المعتمدة والجاهزة للتنفيذ',
    shade: 'navy',
    order: 4,
    isApprovedSection: true,
  },
];

export const BLUE_SHADE_STYLES: Record<
  BlueShadeKey,
  {
    label: string;
    cubeBg: string;
    cubeBorder: string;
    cubeTopBevel: string;
    cubeBottomBevel: string;
    iconBg: string;
    swatch: string;
  }
> = {
  azure: {
    label: 'أزرق سماوي',
    cubeBg: 'from-[#2563EB] to-[#1D4ED8]',
    cubeBorder: 'border-[#60A5FA]/40',
    cubeTopBevel: 'bg-[#93C5FD]/25',
    cubeBottomBevel: 'bg-[#1E3A8A]/45',
    iconBg: 'bg-white/15',
    swatch: '#2563EB',
  },
  royal: {
    label: 'أزرق ملكي',
    cubeBg: 'from-[#1D4ED8] to-[#1E40AF]',
    cubeBorder: 'border-[#60A5FA]/35',
    cubeTopBevel: 'bg-[#93C5FD]/20',
    cubeBottomBevel: 'bg-[#0F2747]/50',
    iconBg: 'bg-white/15',
    swatch: '#1D4ED8',
  },
  cobalt: {
    label: 'أزرق كوبالت',
    cubeBg: 'from-[#1E40AF] to-[#172554]',
    cubeBorder: 'border-[#3B82F6]/35',
    cubeTopBevel: 'bg-[#60A5FA]/20',
    cubeBottomBevel: 'bg-[#091533]/55',
    iconBg: 'bg-white/15',
    swatch: '#1E40AF',
  },
  sapphire: {
    label: 'أزرق ياقوتي',
    cubeBg: 'from-[#0284C7] to-[#0369A1]',
    cubeBorder: 'border-[#7DD3FC]/40',
    cubeTopBevel: 'bg-[#BAE6FD]/25',
    cubeBottomBevel: 'bg-[#0C4A6E]/50',
    iconBg: 'bg-white/15',
    swatch: '#0284C7',
  },
  navy: {
    label: 'أزرق كحلي عميق',
    cubeBg: 'from-[#0F294D] to-[#08172E]',
    cubeBorder: 'border-[#3B82F6]/40',
    cubeTopBevel: 'bg-[#60A5FA]/20',
    cubeBottomBevel: 'bg-[#040C18]/65',
    iconBg: 'bg-white/15',
    swatch: '#0F294D',
  },
};
