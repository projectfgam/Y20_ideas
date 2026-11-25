import {DEFAULT_SECTIONS} from '../constants';
import type {AppSnapshot, CloudSyncConfig, IdeaItem, SectionConfig, UserRole} from '../types';

const DB_NAME = 'afkar_workspace_db';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
const SNAPSHOT_KEY = 'primary_state';

const ROLE_STORAGE_KEY = 'afkar_user_role';
const CLOUD_CONFIG_KEY = 'afkar_cloud_sync_config';
const LOCAL_INDEX_KEY = 'afkar_snapshot_backup_meta';

const DEFAULT_SNAPSHOT: AppSnapshot = {
  version: 1,
  updatedAt: Date.now(),
  sections: DEFAULT_SECTIONS,
  ideas: [],
};

function getEnvDefaultCloudConfig(): CloudSyncConfig {
  const envProjectId = (import.meta.env.VITE_FIRESTORE_PROJECT_ID as string | undefined)?.trim() ?? '';
  const envEndpoint = (import.meta.env.VITE_CLOUD_ENDPOINT as string | undefined)?.trim() ?? '';
  const envProvider = (import.meta.env.VITE_CLOUD_PROVIDER as string | undefined)?.trim();

  if (envProjectId) {
    return {
      enabled: true,
      providerType: 'firebase-firestore',
      endpointUrl: '',
      firestoreProjectId: envProjectId,
      firestoreDocPath: 'afkar/workspace',
      authToken: '',
      autoSync: true,
    };
  }

  if (envEndpoint) {
    return {
      enabled: true,
      providerType: envProvider === 'custom-rest' ? 'custom-rest' : 'firebase-rtdb',
      endpointUrl: envEndpoint,
      firestoreProjectId: '',
      firestoreDocPath: 'afkar/workspace',
      authToken: '',
      autoSync: true,
    };
  }

  return {
    enabled: false,
    providerType: 'firebase-firestore',
    endpointUrl: '',
    firestoreProjectId: '',
    firestoreDocPath: 'afkar/workspace',
    authToken: '',
    autoSync: true,
  };
}

export const DEFAULT_CLOUD_CONFIG: CloudSyncConfig = getEnvDefaultCloudConfig();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

async function readFromIndexedDB(): Promise<AppSnapshot | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(SNAPSHOT_KEY);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as AppSnapshot | undefined) ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error ?? new Error('IndexedDB read failed'));
    };
  });
}

async function writeToIndexedDB(snapshot: AppSnapshot): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(snapshot, SNAPSHOT_KEY);
    req.onsuccess = () => {
      db.close();
      resolve();
    };
    req.onerror = () => {
      db.close();
      reject(req.error ?? new Error('IndexedDB write failed'));
    };
  });
}

function normalizeSections(sections?: SectionConfig[]): SectionConfig[] {
  if (!sections || sections.length === 0) {
    return DEFAULT_SECTIONS;
  }
  const byId = new Map(sections.map((s) => [s.id, s]));
  for (const def of DEFAULT_SECTIONS) {
    if (!byId.has(def.id)) {
      byId.set(def.id, def);
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.order - b.order);
}

function normalizeSnapshot(raw?: Partial<AppSnapshot> | null): AppSnapshot {
  if (!raw) {
    return {...DEFAULT_SNAPSHOT, updatedAt: Date.now()};
  }
  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
    sections: normalizeSections(raw.sections),
    ideas: Array.isArray(raw.ideas) ? raw.ideas : [],
  };
}

export async function loadLocalSnapshot(): Promise<AppSnapshot> {
  try {
    const idbData = await readFromIndexedDB();
    if (idbData) {
      return normalizeSnapshot(idbData);
    }
  } catch {
    // Fallback to localStorage below
  }

  try {
    const raw = localStorage.getItem(LOCAL_INDEX_KEY);
    if (raw) {
      return normalizeSnapshot(JSON.parse(raw) as Partial<AppSnapshot>);
    }
  } catch {
    // Ignore parse errors
  }

  return normalizeSnapshot(DEFAULT_SNAPSHOT);
}

export async function saveLocalSnapshot(snapshot: AppSnapshot): Promise<void> {
  const payload: AppSnapshot = {
    ...snapshot,
    updatedAt: Date.now(),
  };

  try {
    await writeToIndexedDB(payload);
  } catch {
    // Ignore if IndexedDB fails in private mode
  }

  // Also store lightweight/fallback mirror in localStorage when within quota
  try {
    localStorage.setItem(LOCAL_INDEX_KEY, JSON.stringify(payload));
  } catch {
    // If large PDFs/images exceed 5MB localStorage quota, store metadata-only index
    try {
      const liteSections: SectionConfig[] = payload.sections.map((sec) => ({
        ...sec,
        coverImageDataUrl: undefined,
      }));
      const liteIdeas: IdeaItem[] = payload.ideas.map((idea) => ({
        ...idea,
        attachment: idea.attachment
          ? {
              imageName: idea.attachment.imageName,
              pdfName: idea.attachment.pdfName,
            }
          : undefined,
      }));
      localStorage.setItem(
        LOCAL_INDEX_KEY,
        JSON.stringify({...payload, sections: liteSections, ideas: liteIdeas}),
      );
    } catch {
      // Ignore quota error
    }
  }
}

export function loadSavedRole(): UserRole {
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    if (saved === 'manager') {
      return 'manager';
    }
  } catch {
    // Ignore
  }
  return 'guest';
}

export function saveRole(role: UserRole): void {
  try {
    if (role === 'manager') {
      localStorage.setItem(ROLE_STORAGE_KEY, 'manager');
    } else {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
}

export function loadCloudConfig(): CloudSyncConfig {
  const defaults = getEnvDefaultCloudConfig();
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (raw) {
      return {...defaults, ...(JSON.parse(raw) as Partial<CloudSyncConfig>)};
    }
  } catch {
    // Ignore
  }
  return defaults;
}

export function saveCloudConfig(config: CloudSyncConfig): void {
  try {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

export function hasCloudTarget(config: CloudSyncConfig): boolean {
  if (config.providerType === 'firebase-firestore') {
    return Boolean(config.firestoreProjectId?.trim());
  }
  return Boolean(config.endpointUrl.trim());
}

function resolveFirestoreDocumentUrl(config: CloudSyncConfig): string {
  const projectId = config.firestoreProjectId?.trim();
  if (!projectId) {
    throw new Error('الرجاء إدخال معرف مشروع Firebase (Project ID)');
  }
  const cleanDocPath = (config.firestoreDocPath?.trim() || 'afkar/workspace').replace(
    /^\/+|\/+$/g,
    '',
  );
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${cleanDocPath}`;
}

function resolveCloudEndpoint(config: CloudSyncConfig): string {
  if (config.providerType === 'firebase-firestore') {
    return resolveFirestoreDocumentUrl(config);
  }

  const base = config.endpointUrl.trim().replace(/\/+$/, '');
  if (!base) {
    throw new Error('الرجاء إدخال رابط قاعدة البيانات السحابية');
  }

  if (config.providerType === 'firebase-rtdb') {
    const jsonUrl = base.endsWith('.json') ? base : `${base}/afkar_workspace.json`;
    if (config.authToken?.trim()) {
      const separator = jsonUrl.includes('?') ? '&' : '?';
      return `${jsonUrl}${separator}auth=${encodeURIComponent(config.authToken.trim())}`;
    }
    return jsonUrl;
  }

  return base;
}

export async function pushSnapshotToCloud(
  snapshot: AppSnapshot,
  config: CloudSyncConfig,
): Promise<AppSnapshot> {
  const url = resolveCloudEndpoint(config);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.providerType === 'firebase-firestore') {
    if (config.authToken?.trim()) {
      headers.Authorization = `Bearer ${config.authToken.trim()}`;
    }
    const firestorePayload = {
      fields: {
        version: {integerValue: String(snapshot.version)},
        updatedAt: {integerValue: String(snapshot.updatedAt)},
        payloadJson: {stringValue: JSON.stringify(snapshot)},
      },
    };
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(firestorePayload),
    });
    if (!response.ok) {
      throw new Error(`تعذر الحفظ في Firestore (${response.status})`);
    }
    return snapshot;
  }

  if (config.providerType === 'custom-rest' && config.authToken?.trim()) {
    headers.Authorization = `Bearer ${config.authToken.trim()}`;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(snapshot),
  });

  if (!response.ok) {
    throw new Error(`تعذر الرفع إلى السحابة (${response.status})`);
  }

  return snapshot;
}

export async function pullSnapshotFromCloud(
  config: CloudSyncConfig,
): Promise<AppSnapshot | null> {
  const url = resolveCloudEndpoint(config);
  const headers: Record<string, string> = {};

  if (config.providerType === 'firebase-firestore') {
    if (config.authToken?.trim()) {
      headers.Authorization = `Bearer ${config.authToken.trim()}`;
    }
    const response = await fetch(url, {method: 'GET', headers});
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`تعذر الجلب من Firestore (${response.status})`);
    }
    const doc = (await response.json()) as {
      fields?: {payloadJson?: {stringValue?: string}};
    };
    const jsonString = doc?.fields?.payloadJson?.stringValue;
    if (!jsonString) return null;
    return normalizeSnapshot(JSON.parse(jsonString) as Partial<AppSnapshot>);
  }

  if (config.providerType === 'custom-rest' && config.authToken?.trim()) {
    headers.Authorization = `Bearer ${config.authToken.trim()}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`تعذر الجلب من السحابة (${response.status})`);
  }

  const data = (await response.json()) as Partial<AppSnapshot> | null;
  if (!data || (!data.sections && !data.ideas)) {
    return null;
  }
  return normalizeSnapshot(data);
}
