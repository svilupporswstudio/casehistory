import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon, FileText, Video } from 'lucide-react';
import type {
  CaseHistoryItem,
  CaseHistoryStatus,
  GalleryImage,
  PdfAttachment,
  PdfAttachmentCategory,
  TaxonomyTerm,
} from '../types/caseHistory';
import { SEED_IMAGE_OPTIONS } from '../data/seedData';
import { extractYouTubeId, slugify } from '../utils/wpHelpers';

interface CaseEditorModalProps {
  isOpen: boolean;
  editingItem: CaseHistoryItem | null;
  categories: TaxonomyTerm[];
  tags: TaxonomyTerm[];
  onClose: () => void;
  onSave: (item: CaseHistoryItem) => void;
}

export function CaseEditorModal({
  isOpen,
  editingItem,
  categories,
  tags,
  onClose,
  onSave,
}: CaseEditorModalProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<CaseHistoryStatus>('publish');
  const [publishedDate, setPublishedDate] = useState('');
  const [menuOrder, setMenuOrder] = useState(1);
  const [featuredImage, setFeaturedImage] = useState(SEED_IMAGE_OPTIONS[0].url);
  const [codice, setCodice] = useState('');
  const [anno, setAnno] = useState(String(new Date().getFullYear()));
  const [videoUrl, setVideoUrl] = useState('');
  const [galleria, setGalleria] = useState<GalleryImage[]>([]);
  const [allegati, setAllegati] = useState<PdfAttachment[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState(SEED_IMAGE_OPTIONS[0].url);
  const [pdfLimitMessage, setPdfLimitMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPdfLimitMessage('');
    if (editingItem) {
      setTitle(editingItem.title);
      setSlug(editingItem.slug);
      setSlugEdited(true);
      setExcerpt(editingItem.excerpt);
      setContent(editingItem.content);
      setStatus(editingItem.status);
      setPublishedDate(editingItem.publishedAt.slice(0, 10));
      setMenuOrder(editingItem.menuOrder);
      setFeaturedImage(editingItem.featuredImage);
      setCodice(editingItem.meta.codice);
      setAnno(editingItem.meta.anno);
      setVideoUrl(editingItem.meta.videoUrl);
      setGalleria(editingItem.meta.galleria);
      setAllegati(editingItem.meta.allegati);
      setSelectedCategories(editingItem.categoryIds);
      setSelectedTags(editingItem.tagIds);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setTitle('');
      setSlug('');
      setSlugEdited(false);
      setExcerpt('');
      setContent('');
      setStatus('publish');
      setPublishedDate(today);
      setMenuOrder(1);
      setFeaturedImage(SEED_IMAGE_OPTIONS[0].url);
      setCodice(`CH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90) + 10)}`);
      setAnno(String(new Date().getFullYear()));
      setVideoUrl('');
      setGalleria([]);
      setAllegati([]);
      setSelectedCategories(categories[0] ? [categories[0].id] : []);
      setSelectedTags([]);
    }
  }, [isOpen, editingItem, categories]);

  useEffect(() => {
    if (!slugEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugEdited]);

  if (!isOpen) return null;

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleAddGalleryFromPreset = () => {
    if (!newGalleryUrl) return;
    const label =
      newGalleryTitle.trim() ||
      SEED_IMAGE_OPTIONS.find((opt) => opt.url === newGalleryUrl)?.label ||
      `Immagine ${galleria.length + 1}`;
    setGalleria((prev) => [
      ...prev,
      {
        id: `gal-${Date.now()}-${prev.length}`,
        url: newGalleryUrl,
        fullUrl: newGalleryUrl,
        title: label,
        caption: '',
      },
    ]);
    setNewGalleryTitle('');
  };

  const handleGalleryFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setGalleria((prev) => [
            ...prev,
            {
              id: `gal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              url: reader.result as string,
              fullUrl: reader.result as string,
              title: file.name.replace(/\.[^.]+$/, ''),
              caption: 'Caricata localmente',
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handlePdfUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - allegati.length;
    if (remaining <= 0) {
      setPdfLimitMessage('Limite massimo di 5 file PDF raggiunto (max_file_uploads = 5).');
      e.target.value = '';
      return;
    }

    const accepted = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      setPdfLimitMessage(
        `Sono stati aggiunti solo ${remaining} file per rispettare il limite di 5 allegati PDF.`,
      );
    } else {
      setPdfLimitMessage('');
    }

    accepted.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const sizeKb = Math.max(1, Math.round(file.size / 1024));
        const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
        setAllegati((prev) => {
          if (prev.length >= 5) return prev;
          return [
            ...prev,
            {
              id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              title: file.name.replace(/\.pdf$/i, ''),
              fileName: file.name,
              sizeLabel,
              category: 'Scheda Tecnica',
              url: typeof reader.result === 'string' ? reader.result : '#',
              summary: 'Documento PDF allegato',
            },
          ];
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddSamplePdf = () => {
    if (allegati.length >= 5) {
      setPdfLimitMessage('Limite massimo di 5 file PDF raggiunto (max_file_uploads = 5).');
      return;
    }
    setPdfLimitMessage('');
    const index = allegati.length + 1;
    setAllegati((prev) => [
      ...prev,
      {
        id: `pdf-${Date.now()}-${index}`,
        title: `Scheda Tecnica ${codice || 'Progetto'} #${index}`,
        fileName: `scheda-tecnica-${slug || 'case-history'}-${index}.pdf`,
        sizeLabel: '1.2 MB',
        category: 'Scheda Tecnica',
        url: `#sample-${index}`,
        summary: 'Documento tecnico generato automaticamente.',
      },
    ]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const item: CaseHistoryItem = {
      id: editingItem?.id || `ch-${Date.now()}`,
      title: title.trim(),
      slug: slugify(slug || title),
      excerpt: excerpt.trim(),
      content: content.trim() || excerpt.trim(),
      featuredImage: featuredImage || SEED_IMAGE_OPTIONS[0].url,
      status,
      publishedAt: publishedDate ? new Date(`${publishedDate}T09:00:00.000Z`).toISOString() : new Date().toISOString(),
      menuOrder: Number(menuOrder) || 1,
      views: editingItem?.views ?? 1,
      categoryIds: selectedCategories,
      tagIds: selectedTags,
      meta: {
        codice: codice.trim(),
        anno: anno.trim(),
        galleria,
        allegati: allegati.slice(0, 5),
        videoUrl: videoUrl.trim(),
      },
    };
    onSave(item);
  };

  const youtubePreviewId = extractYouTubeId(videoUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 sm:p-6 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-editor-title"
    >
      <form
        onSubmit={handleSubmit}
        className="my-4 w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="case-editor-title" className="font-display text-lg font-bold text-slate-900">
              {editingItem ? 'Modifica Case History' : 'Aggiungi Case History'}
            </h2>
            <p className="text-xs text-slate-500">
              Campi Custom Post Type casehistory e Meta Box RWMB (casehistory_metabox.php)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi editor"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Main left 2 columns: CPT content + Meta Boxes */}
          <div className="lg:col-span-2 space-y-6 p-6">
            {/* Core WP Title, Slug, Excerpt, Content */}
            <div className="space-y-4">
              <div>
                <label htmlFor="ch-title" className="block text-xs font-semibold text-slate-700">
                  Titolo Case History *
                </label>
                <input
                  id="ch-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Impianto Fotovoltaico 1,8 MWp — Polo Logistico"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="ch-slug" className="block text-xs font-semibold text-slate-700">
                  Permalink (slug)
                </label>
                <div className="mt-1.5 flex items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-500">
                  <span>/casehistory/</span>
                  <input
                    id="ch-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setSlug(e.target.value);
                    }}
                    className="ml-1 w-full bg-transparent text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ch-excerpt" className="block text-xs font-semibold text-slate-700">
                  Riassunto (Excerpt)
                </label>
                <textarea
                  id="ch-excerpt"
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Sintesi esecutiva mostrata nell'archivio e nelle anteprime..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="ch-content" className="block text-xs font-semibold text-slate-700">
                  Descrizione completa (Editor)
                </label>
                <textarea
                  id="ch-content"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Contesto progettuale, soluzioni adottate e risultati misurabili..."
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Meta Box 1: Dati della Case History */}
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Dati della Case History
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ch-codice" className="block text-xs font-medium text-slate-700">
                    Codice (casehistory_codice)
                  </label>
                  <input
                    id="ch-codice"
                    type="text"
                    value={codice}
                    onChange={(e) => setCodice(e.target.value)}
                    placeholder="CH-2026-001"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="ch-anno" className="block text-xs font-medium text-slate-700">
                    Anno (casehistory_anno)
                  </label>
                  <input
                    id="ch-anno"
                    type="text"
                    value={anno}
                    onChange={(e) => setAnno(e.target.value)}
                    placeholder="2026"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Meta Box 2: Galleria immagini (image_advanced) */}
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Galleria immagini (casehistory_galleria)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selezione multipla della galleria foto della Case History.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Carica foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <select
                  aria-label="Seleziona immagine di archivio"
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                  className="sm:col-span-5 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  {SEED_IMAGE_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.url}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newGalleryTitle}
                  onChange={(e) => setNewGalleryTitle(e.target.value)}
                  placeholder="Didascalia / titolo foto"
                  className="sm:col-span-5 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryFromPreset}
                  className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Aggiungi</span>
                </button>
              </div>

              {galleria.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galleria.map((img) => (
                    <div
                      key={img.id}
                      className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden">
                        <img
                          src={img.url}
                          alt={img.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2">
                        <span className="truncate text-xs text-slate-700">{img.title}</span>
                        <button
                          type="button"
                          aria-label={`Rimuovi ${img.title}`}
                          onClick={() => setGalleria((prev) => prev.filter((g) => g.id !== img.id))}
                          className="text-slate-400 hover:text-red-600 shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500">
                  <ImageIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  <span>Nessuna immagine aggiuntiva in galleria.</span>
                </div>
              )}
            </div>

            {/* Meta Box 3: Allegati PDF (max 5) */}
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Allegati solo PDF (casehistory_allegati — {allegati.length}/5)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Schede tecniche, manuali, certificazioni (max_file_uploads: 5).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddSamplePdf}
                    disabled={allegati.length >= 5}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    + Scheda esempio
                  </button>
                  <label
                    className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 ${
                      allegati.length >= 5 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Carica PDF</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      disabled={allegati.length >= 5}
                      onChange={handlePdfUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {pdfLimitMessage && (
                <p className="text-xs font-medium text-amber-700">{pdfLimitMessage}</p>
              )}

              {allegati.length > 0 && (
                <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                  {allegati.map((pdf) => (
                    <div key={pdf.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileText className="h-4 w-4 text-red-600 shrink-0" aria-hidden="true" />
                        <input
                          type="text"
                          value={pdf.title}
                          onChange={(e) =>
                            setAllegati((prev) =>
                              prev.map((item) =>
                                item.id === pdf.id ? { ...item, title: e.target.value } : item,
                              ),
                            )
                          }
                          aria-label="Titolo allegato PDF"
                          className="w-full min-w-[140px] rounded border border-transparent px-1.5 py-0.5 text-xs font-medium text-slate-900 hover:border-slate-200 focus:border-blue-700 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          aria-label="Tipologia PDF"
                          value={pdf.category}
                          onChange={(e) =>
                            setAllegati((prev) =>
                              prev.map((item) =>
                                item.id === pdf.id
                                  ? { ...item, category: e.target.value as PdfAttachmentCategory }
                                  : item,
                              ),
                            )
                          }
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700"
                        >
                          <option value="Scheda Tecnica">Scheda Tecnica</option>
                          <option value="Manuale">Manuale</option>
                          <option value="Certificazione">Certificazione</option>
                        </select>
                        <span className="font-mono text-xs text-slate-500 tabular-nums">
                          {pdf.sizeLabel}
                        </span>
                        <button
                          type="button"
                          aria-label={`Elimina ${pdf.title}`}
                          onClick={() => setAllegati((prev) => prev.filter((p) => p.id !== pdf.id))}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meta Box 4: Video YouTube (oembed) */}
            <div className="space-y-3 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Video YouTube (casehistory_video)
                </h3>
              </div>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
              {videoUrl && (
                <p className="text-xs text-slate-500">
                  {youtubePreviewId
                    ? `Video YouTube riconosciuto (ID: ${youtubePreviewId}) — pronto per oEmbed.`
                    : 'Inserisci un link YouTube valido (youtube.com/watch?v=... o youtu.be/...).'}
                </p>
              )}
            </div>
          </div>

          {/* Right Sidebar: Pubblica, Immagine in evidenza, Categorie, Tag */}
          <div className="space-y-6 bg-slate-50/70 p-6">
            {/* Pubblica box */}
            <div className="space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-900">Pubblicazione</h3>
              <div>
                <label htmlFor="ch-status" className="block text-xs font-medium text-slate-700">
                  Stato
                </label>
                <select
                  id="ch-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as CaseHistoryStatus)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="publish">Pubblicata</option>
                  <option value="draft">Bozza</option>
                  <option value="future">Schedulata</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ch-date" className="block text-xs font-medium text-slate-700">
                    Data
                  </label>
                  <input
                    id="ch-date"
                    type="date"
                    value={publishedDate}
                    onChange={(e) => setPublishedDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="ch-order" className="block text-xs font-medium text-slate-700">
                    Ordine
                  </label>
                  <input
                    id="ch-order"
                    type="number"
                    min={0}
                    value={menuOrder}
                    onChange={(e) => setMenuOrder(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-mono text-slate-900 tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Immagine in evidenza */}
            <div className="space-y-3 border-t border-slate-200 pt-5">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Immagine in evidenza
              </h3>
              <div className="aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
                <img
                  src={featuredImage}
                  alt="Anteprima immagine in evidenza"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <select
                aria-label="Scegli immagine in evidenza"
                value={
                  SEED_IMAGE_OPTIONS.some((o) => o.url === featuredImage) ? featuredImage : 'custom'
                }
                onChange={(e) => {
                  if (e.target.value !== 'custom') setFeaturedImage(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
              >
                {SEED_IMAGE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.url}>
                    {opt.label}
                  </option>
                ))}
                {!SEED_IMAGE_OPTIONS.some((o) => o.url === featuredImage) && (
                  <option value="custom">Immagine personalizzata</option>
                )}
              </select>
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Carica immagine locale</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') setFeaturedImage(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Tassonomia: casehistory_cat */}
            <div className="space-y-2.5 border-t border-slate-200 pt-5">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Categorie (casehistory_cat)
              </h3>
              <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className={`flex items-center gap-2 text-xs text-slate-700 cursor-pointer ${
                      cat.parentId ? 'pl-4' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tassonomia: casehistory_tag */}
            <div className="space-y-2.5 border-t border-slate-200 pt-5">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Tag (casehistory_tag)
              </h3>
              <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded border-slate-300 text-blue-700 focus:ring-blue-700"
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            {editingItem ? 'Aggiorna Case History' : 'Pubblica Case History'}
          </button>
        </div>
      </form>
    </div>
  );
}
