export type CaseHistoryStatus = 'publish' | 'draft' | 'future';

export interface GalleryImage {
  id: string;
  url: string;
  fullUrl: string;
  title: string;
  caption?: string;
}

export type PdfAttachmentCategory = 'Scheda Tecnica' | 'Manuale' | 'Certificazione';

export interface PdfAttachment {
  id: string;
  title: string;
  fileName: string;
  sizeLabel: string;
  category: PdfAttachmentCategory;
  url: string;
  summary?: string;
}

export interface CaseHistoryMeta {
  codice: string;
  anno: string;
  galleria: GalleryImage[];
  allegati: PdfAttachment[];
  videoUrl: string;
}

export interface CaseHistoryItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  status: CaseHistoryStatus;
  publishedAt: string;
  menuOrder: number;
  views: number;
  meta: CaseHistoryMeta;
  categoryIds: string[];
  tagIds: string[];
}

export interface TaxonomyTerm {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description?: string;
}

export interface PluginOptions {
  facebook: string;
  youtube: string;
  twitter: string;
  googleplus: string;
  smtpHost: string;
  smtpUser: string;
  smtpPassword: string;
}

export interface CaseHistoryStoreState {
  caseHistories: CaseHistoryItem[];
  categories: TaxonomyTerm[];
  tags: TaxonomyTerm[];
  options: PluginOptions;
}

export interface PluginFileEntry {
  path: string;
  name: string;
  size: number;
  lines: number;
  isBinary: boolean;
  content: string | null;
  previewUrl?: string;
}
