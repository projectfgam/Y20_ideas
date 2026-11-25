export type UserRole = 'guest' | 'manager';

export type BlueShadeKey =
  | 'azure'
  | 'royal'
  | 'cobalt'
  | 'sapphire'
  | 'navy';

export interface SectionConfig {
  id: string;
  title: string;
  subtitle: string;
  shade: BlueShadeKey;
  order: number;
  isApprovedSection?: boolean;
  coverImageDataUrl?: string;
  coverImageName?: string;
}

export interface IdeaAttachment {
  imageDataUrl?: string;
  imageName?: string;
  pdfDataUrl?: string;
  pdfName?: string;
}

export type IdeaSentiment = 'positive' | 'negative' | null;

export interface IdeaItem {
  id: string;
  sectionId: string;
  originalSectionId: string;
  title: string;
  details: string;
  rating: number; // 0 to 5
  sentiment?: IdeaSentiment;
  approved: boolean;
  approvedAt?: number;
  createdAt: number;
  updatedAt: number;
  sourceType: 'manual' | 'pdf';
  attachment?: IdeaAttachment;
}

export interface CloudSyncConfig {
  enabled: boolean;
  providerType: 'firebase-firestore' | 'firebase-rtdb' | 'custom-rest';
  endpointUrl: string;
  firestoreProjectId?: string;
  firestoreDocPath?: string;
  authToken?: string;
  autoSync: boolean;
  lastSyncedAt?: number;
}

export interface AppSnapshot {
  version: number;
  updatedAt: number;
  sections: SectionConfig[];
  ideas: IdeaItem[];
}
