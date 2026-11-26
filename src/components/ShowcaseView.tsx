import { useMemo, useState } from 'react';
import { Search, ArrowUpRight, Building2, RotateCcw } from 'lucide-react';
import type { CaseHistoryItem, TaxonomyTerm } from '../types/caseHistory';
import { formatItalianDate } from '../utils/wpHelpers';

interface ShowcaseViewProps {
  items: CaseHistoryItem[];
  categories: TaxonomyTerm[];
  tags: TaxonomyTerm[];
  selectedCategorySlug: string;
  onCategoryChange: (slug: string) => void;
  onSelectCase: (item: CaseHistoryItem) => void;
  onCreateNew: () => void;
}

export function ShowcaseView({
  items,
  categories,
  tags,
  selectedCategorySlug,
  onCategoryChange,
  onSelectCase,
  onCreateNew,
}: ShowcaseViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const publishedItems = useMemo(
    () =>
      items
        .filter((item) => item.status === 'publish')
        .sort((a, b) => a.menuOrder - b.menuOrder),
    [items],
  );

  const availableYears = useMemo(() => {
    const years = new Set(
      publishedItems.map((i) => i.meta.anno).filter((y) => y.trim().length > 0),
    );
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [publishedItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchedCat = categories.find((c) => c.slug === selectedCategorySlug);

    return publishedItems.filter((item) => {
      if (matchedCat) {
        const childIds = categories
          .filter((c) => c.parentId === matchedCat.id)
          .map((c) => c.id);
        const validCatIds = new Set([matchedCat.id, ...childIds]);
        if (!item.categoryIds.some((cid) => validCatIds.has(cid))) return false;
      }

      if (selectedTagId && !item.tagIds.includes(selectedTagId)) {
        return false;
      }

      if (selectedYear && item.meta.anno !== selectedYear) {
        return false;
      }

      if (q) {
        const haystack = [
          item.title,
          item.excerpt,
          item.meta.codice,
          item.meta.anno,
          item.slug,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [publishedItems, categories, selectedCategorySlug, selectedTagId, selectedYear, searchQuery]);

  const featuredCase = publishedItems[0] ?? null;

  const totalPdfs = publishedItems.reduce((acc, item) => acc + item.meta.allegati.length, 0);
  const totalViews = publishedItems.reduce((acc, item) => acc + item.views, 0);

  const hasActiveFilter =
    Boolean(searchQuery.trim()) ||
    Boolean(selectedCategorySlug) ||
    Boolean(selectedTagId) ||
    Boolean(selectedYear);

  const resetFilters = () => {
    setSearchQuery('');
    onCategoryChange('');
    setSelectedTagId('');
    setSelectedYear('');
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10 space-y-12">
      {/* Split Hero: Left typographic hierarchy + Right matching height visual */}
      {featuredCase ? (
        <section className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-blue-700">Case Study in evidenza</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{featuredCase.meta.codice}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{featuredCase.meta.anno}</span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
                  {featuredCase.title}
                </h1>
                <p className="text-[15px] leading-relaxed text-slate-600 max-w-[65ch]">
                  {featuredCase.excerpt}
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
                <div className="text-xs text-slate-500">
                  <span>{formatItalianDate(featuredCase.publishedAt)}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="tabular-nums">
                    {featuredCase.meta.allegati.length} allegati PDF
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCase(featuredCase)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                >
                  <span>Apri Case History</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectCase(featuredCase)}
              className="lg:col-span-6 group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 text-left min-h-[280px]"
            >
              {!brokenImages[featuredCase.id] ? (
                <img
                  src={featuredCase.featuredImage}
                  alt={featuredCase.title}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setBrokenImages((prev) => ({ ...prev, [featuredCase.id]: true }))
                  }
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] lg:h-full"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-slate-300">
                  <Building2 className="mb-3 h-10 w-10 text-slate-500" aria-hidden="true" />
                  <span className="font-display text-sm font-semibold">{featuredCase.title}</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-6">
                <span className="text-xs font-mono text-slate-200">
                  /casehistory/{featuredCase.slug}/
                </span>
              </div>
            </button>
          </div>

          {/* 4-column KPI strip placed in a full-width row below the hero split */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 rounded-xl border border-slate-200 bg-white">
            <div className="p-5">
              <div className="text-xs text-slate-500">Case History pubblicate</div>
              <div className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
                {publishedItems.length}
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-500">Categorie attive</div>
              <div className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
                {categories.length}
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-500">Schede &amp; allegati PDF</div>
              <div className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
                {totalPdfs}
              </div>
            </div>
            <div className="p-5">
              <div className="text-xs text-slate-500">Visualizzazioni archivio</div>
              <div className="mt-1 font-display text-2xl font-bold text-slate-900 tabular-nums">
                {totalViews.toLocaleString('it-IT')}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Archivio Case History vuoto
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Pubblica la tua prima Case History per visualizzarla nella vetrina pubblica.
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
          >
            Crea prima Case History
          </button>
        </section>
      )}

      {/* Search & Filter Widget Bar (faithful to casehistory_widget.php + taxonomies) */}
      <section className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">
              Archivio Case History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ricerca per categoria, tag, anno o codice commessa (slug archivio /casehistory/).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca titolo o codice..."
                aria-label="Cerca Case History"
                className="w-full lg:w-56 rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none"
              />
            </div>

            <select
              aria-label="Scegli una categoria"
              value={selectedCategorySlug}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-700 focus:outline-none"
            >
              <option value="">Tutte le categorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.parentId ? `— ${cat.name}` : cat.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtra per tag"
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-700 focus:outline-none"
            >
              <option value="">Tutti i tag</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtra per anno"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 font-mono tabular-nums focus:border-blue-700 focus:outline-none"
            >
              <option value="">Tutti gli anni</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const catNames = categories
                .filter((c) => item.categoryIds.includes(c.id))
                .map((c) => c.name);
              return (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-300"
                >
                  <button
                    type="button"
                    onClick={() => onSelectCase(item)}
                    className="flex flex-1 flex-col text-left focus-visible:outline-2 focus-visible:outline-blue-700"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      {!brokenImages[item.id] ? (
                        <img
                          src={item.featuredImage}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setBrokenImages((prev) => ({ ...prev, [item.id]: true }))
                          }
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-100 p-6 text-slate-500">
                          <Building2 className="mb-2 h-8 w-8 text-slate-400" aria-hidden="true" />
                          <span className="text-xs font-medium text-center">{item.title}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-6">
                      <div className="space-y-3">
                        {/* Unboxed clean metadata with typographic separators */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono tabular-nums text-slate-700 font-medium">
                            {item.meta.codice || 'N/D'}
                          </span>
                          {item.meta.anno && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{item.meta.anno}</span>
                            </>
                          )}
                          {catNames.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{catNames[0]}</span>
                            </>
                          )}
                        </div>

                        <h3 className="font-display text-lg font-bold leading-snug text-slate-900 group-hover:text-blue-700 transition-colors">
                          {item.title}
                        </h3>

                        <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">
                          {item.excerpt}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
                        <span className="tabular-nums">
                          {item.meta.galleria.length} foto · {item.meta.allegati.length} PDF
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                          <span>Dettagli</span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="font-display text-base font-semibold text-slate-900">
              Nessuna Case History trovata
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Nessun progetto corrisponde ai criteri selezionati.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Mostra tutte le Case History
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
