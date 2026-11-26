import { useEffect, useState } from 'react';
import {
  X,
  Download,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Share2,
  Pencil,
  Building2,
} from 'lucide-react';
import type { CaseHistoryItem, PluginOptions, TaxonomyTerm } from '../types/caseHistory';
import {
  downloadPdfAttachment,
  extractYouTubeId,
  formatItalianDate,
  getStatusLabel,
} from '../utils/wpHelpers';

interface CaseDetailModalProps {
  item: CaseHistoryItem | null;
  categories: TaxonomyTerm[];
  tags: TaxonomyTerm[];
  options: PluginOptions;
  onClose: () => void;
  onEdit: (item: CaseHistoryItem) => void;
}

export function CaseDetailModal({
  item,
  categories,
  tags,
  options,
  onClose,
  onEdit,
}: CaseDetailModalProps) {
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setActiveGalleryIndex(0);
    setImgError(false);
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onClose]);

  if (!item) return null;

  const itemCategories = categories.filter((c) => item.categoryIds.includes(c.id));
  const itemTags = tags.filter((t) => item.tagIds.includes(t.id));
  const gallery =
    item.meta.galleria.length > 0
      ? item.meta.galleria
      : item.featuredImage
        ? [
            {
              id: 'featured',
              url: item.featuredImage,
              fullUrl: item.featuredImage,
              title: item.title,
              caption: item.excerpt,
            },
          ]
        : [];
  const activePhoto = gallery[activeGalleryIndex] ?? gallery[0];
  const youtubeId = extractYouTubeId(item.meta.videoUrl);

  const socialLinks = [
    { label: 'Facebook', url: options.facebook },
    { label: 'YouTube', url: options.youtube },
    { label: 'Twitter', url: options.twitter },
    { label: 'Google+', url: options.googleplus },
  ].filter((s) => s.url.trim().length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 sm:p-8 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-detail-title"
      onClick={onClose}
    >
      <div
        className="relative my-4 w-full max-w-4xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top utility bar */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
            <span>/casehistory/{item.slug}/</span>
            {item.meta.codice && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700">{item.meta.codice}</span>
              </>
            )}
            {item.meta.anno && (
              <>
                <span aria-hidden="true">·</span>
                <span>{item.meta.anno}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{getStatusLabel(item.status)}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Modifica</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi dettaglio"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Hero Visual / Lightbox Gallery */}
        {activePhoto && (
          <div className="relative bg-slate-900">
            <div className="aspect-[16/9] w-full overflow-hidden">
              {!imgError ? (
                <img
                  src={activePhoto.fullUrl || activePhoto.url}
                  alt={activePhoto.title || item.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-800 px-6 text-center text-slate-300">
                  <Building2 className="mb-3 h-10 w-10 text-slate-500" aria-hidden="true" />
                  <p className="font-display text-base font-semibold text-white">{item.title}</p>
                </div>
              )}
            </div>

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Immagine precedente"
                  onClick={() => {
                    setImgError(false);
                    setActiveGalleryIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950/75 text-white transition-colors hover:bg-slate-950"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Immagine successiva"
                  onClick={() => {
                    setImgError(false);
                    setActiveGalleryIndex((prev) => (prev + 1) % gallery.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950/75 text-white transition-colors hover:bg-slate-950"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}

            {activePhoto.caption && (
              <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 py-4 text-xs text-slate-100">
                <span className="font-medium">{activePhoto.title}</span>
                <span aria-hidden="true"> — </span>
                <span className="text-slate-300">{activePhoto.caption}</span>
              </div>
            )}
          </div>
        )}

        {/* Thumbnail strip when gallery has multiple images */}
        {gallery.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto border-b border-slate-200 bg-slate-50 px-6 py-3">
            {gallery.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  setImgError(false);
                  setActiveGalleryIndex(idx);
                }}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md border transition-opacity ${
                  idx === activeGalleryIndex
                    ? 'border-blue-700 ring-2 ring-blue-700/30 opacity-100'
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main Case Content */}
        <div className="space-y-8 p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{formatItalianDate(item.publishedAt)}</span>
              {itemCategories.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">
                    {itemCategories.map((c) => c.name).join(' / ')}
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{item.views.toLocaleString('it-IT')} visualizzazioni</span>
            </div>

            <h2
              id="case-detail-title"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]"
            >
              {item.title}
            </h2>

            {item.excerpt && (
              <p className="text-base leading-relaxed text-slate-600">{item.excerpt}</p>
            )}
          </div>

          {/* Technical metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-y border-slate-200 py-5">
            <div>
              <div className="text-xs text-slate-500">Codice progetto</div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {item.meta.codice || '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Anno realizzazione</div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {item.meta.anno || '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Galleria immagini</div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {item.meta.galleria.length} foto
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Documenti PDF</div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {item.meta.allegati.length} / 5 file
              </div>
            </div>
          </div>

          {/* Full editorial body */}
          <div className="space-y-4 text-[15px] leading-7 text-slate-700 max-w-[70ch]">
            {item.content.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Tags as unboxed text */}
          {itemTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">Tag:</span>
              {itemTags.map((tag, idx) => (
                <span key={tag.id}>
                  {tag.name}
                  {idx < itemTags.length - 1 && <span aria-hidden="true"> · </span>}
                </span>
              ))}
            </div>
          )}

          {/* Allegati PDF (casehistory_allegati) */}
          {item.meta.allegati.length > 0 && (
            <section className="space-y-4 border-t border-slate-200 pt-6">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Allegati tecnici e certificazioni (PDF)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Schede tecniche, manuali e documentazione scaricabile associata al campo casehistory_allegati.
                </p>
              </div>
              <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/50">
                {item.meta.allegati.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{pdf.title}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{pdf.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{pdf.sizeLabel}</span>
                          {pdf.summary && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{pdf.summary}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadPdfAttachment(pdf, item)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap shrink-0 self-start sm:self-center"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Scarica PDF</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Video YouTube (casehistory_video oEmbed) */}
          {item.meta.videoUrl && (
            <section className="space-y-4 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    Video del progetto
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Riproduzione tramite oEmbed YouTube (casehistory_video).
                  </p>
                </div>
                <a
                  href={item.meta.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline whitespace-nowrap"
                >
                  <span>Apri su YouTube</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>

              {youtubeId ? (
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={`Video ${item.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5 truncate">
                    <Play className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
                    <span className="truncate font-mono text-xs">{item.meta.videoUrl}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Social links from Plugin Options */}
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Share2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Canali ufficiali configurati nelle Opzioni Plugin:</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-700 hover:text-blue-700 hover:underline"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
