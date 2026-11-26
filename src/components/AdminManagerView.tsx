import { useMemo, useState, type FormEvent } from 'react';
import {
  Search,
  HelpCircle,
  Eye,
  Pencil,
  Copy,
  Trash2,
  Plus,
} from 'lucide-react';
import type {
  CaseHistoryItem,
  CaseHistoryStatus,
  TaxonomyTerm,
} from '../types/caseHistory';
import { formatShortDate, getStatusLabel, slugify } from '../utils/wpHelpers';

interface AdminManagerViewProps {
  items: CaseHistoryItem[];
  categories: TaxonomyTerm[];
  tags: TaxonomyTerm[];
  onCreateNew: () => void;
  onEdit: (item: CaseHistoryItem) => void;
  onPreview: (item: CaseHistoryItem) => void;
  onDuplicate: (item: CaseHistoryItem) => void;
  onDelete: (id: string) => void;
  onSaveCategories: (categories: TaxonomyTerm[]) => void;
  onSaveTags: (tags: TaxonomyTerm[]) => void;
}

type AdminSubTab = 'elenco' | 'tassonomie';
type StatusFilter = 'all' | CaseHistoryStatus;

export function AdminManagerView({
  items,
  categories,
  tags,
  onCreateNew,
  onEdit,
  onPreview,
  onDuplicate,
  onDelete,
  onSaveCategories,
  onSaveTags,
}: AdminManagerViewProps) {
  const [subTab, setSubTab] = useState<AdminSubTab>('elenco');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Taxonomy form state
  const [taxonomyKind, setTaxonomyKind] = useState<'cat' | 'tag'>('cat');
  const [termName, setTermName] = useState('');
  const [termSlug, setTermSlug] = useState('');
  const [termParentId, setTermParentId] = useState<string>('');
  const [termDesc, setTermDesc] = useState('');

  const counts = useMemo(
    () => ({
      all: items.length,
      publish: items.filter((i) => i.status === 'publish').length,
      draft: items.filter((i) => i.status === 'draft').length,
      future: items.filter((i) => i.status === 'future').length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items
      .filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (q) {
          const text = `${item.title} ${item.meta.codice} ${item.meta.anno}`.toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.menuOrder - b.menuOrder);
  }, [items, statusFilter, searchQuery]);

  const activeTerms = taxonomyKind === 'cat' ? categories : tags;

  const handleAddTerm = (e: FormEvent) => {
    e.preventDefault();
    if (!termName.trim()) return;
    const newTerm: TaxonomyTerm = {
      id: `${taxonomyKind}-${Date.now()}`,
      name: termName.trim(),
      slug: slugify(termSlug.trim() || termName.trim()),
      parentId: termParentId || null,
      description: termDesc.trim() || undefined,
    };
    if (taxonomyKind === 'cat') {
      onSaveCategories([...categories, newTerm]);
    } else {
      onSaveTags([...tags, newTerm]);
    }
    setTermName('');
    setTermSlug('');
    setTermParentId('');
    setTermDesc('');
  };

  const handleDeleteTerm = (id: string) => {
    if (taxonomyKind === 'cat') {
      onSaveCategories(
        categories
          .filter((c) => c.id !== id)
          .map((c) => (c.parentId === id ? { ...c, parentId: null } : c)),
      );
    } else {
      onSaveTags(
        tags
          .filter((t) => t.id !== id)
          .map((t) => (t.parentId === id ? { ...t, parentId: null } : t)),
      );
    }
  };

  const renderStatusText = (status: CaseHistoryStatus) => {
    const label = getStatusLabel(status);
    if (status === 'publish') {
      return <span className="text-xs font-medium text-emerald-700">{label}</span>;
    }
    if (status === 'future') {
      return <span className="text-xs font-medium text-amber-700">{label}</span>;
    }
    return <span className="text-xs font-medium text-slate-600">{label}</span>;
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10 space-y-8">
      {/* Header & contextual help trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Gestione Case History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pannello amministrativo CPT casehistory, Meta Box e tassonomie gerarchiche.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <HelpCircle className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span>{showHelp ? 'Nascondi guida' : 'Guida plugin'}</span>
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Aggiungi Case History</span>
          </button>
        </div>
      </div>

      {/* Contextual Help from casehistory_add_help_text (clean hairline border, no border-l-4) */}
      {showHelp && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 space-y-3">
          <div className="font-display font-semibold text-slate-900">
            Cose da ricordare in modifica di una Case History
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
            <li>Specifica dettagliatamente in che categorie può essere inserito (casehistory_cat).</li>
            <li>Specifica nel titolo la tipologia del progetto o commessa.</li>
            <li>
              Per schedulare una pubblicazione futura: imposta lo stato su Schedulata e scegli una
              data futura.
            </li>
            <li>
              Elenco case history inserite con dettaglio di categoria, codice, anno, allegati PDF
              (max 5) e visualizzazioni.
            </li>
          </ul>
        </div>
      )}

      {/* Segmented Sub-navigation */}
      <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 w-fit">
        <button
          type="button"
          onClick={() => setSubTab('elenco')}
          className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            subTab === 'elenco'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Elenco Case History
        </button>
        <button
          type="button"
          onClick={() => setSubTab('tassonomie')}
          className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            subTab === 'tassonomie'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Categorie &amp; Tag
        </button>
      </div>

      {subTab === 'elenco' ? (
        <div className="space-y-4">
          {/* Status filter tabs + search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200">
              {(
                [
                  { id: 'all', label: `Tutte (${counts.all})` },
                  { id: 'publish', label: `Pubblicate (${counts.publish})` },
                  { id: 'draft', label: `Bozze (${counts.draft})` },
                  { id: 'future', label: `Schedulate (${counts.future})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap tabular-nums ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtra elenco..."
                aria-label="Filtra elenco Case History"
                className="w-full sm:w-64 rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>
          </div>

          {/* High-density data table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3 w-14 text-right">Ord.</th>
                  <th className="px-4 py-3">Titolo Case History</th>
                  <th className="px-4 py-3">Codice</th>
                  <th className="px-4 py-3 text-right">Anno</th>
                  <th className="px-4 py-3">Categorie</th>
                  <th className="px-4 py-3">Stato</th>
                  <th className="px-4 py-3 text-right">Data</th>
                  <th className="px-4 py-3 text-right">Visite</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const catNames = categories
                      .filter((c) => item.categoryIds.includes(c.id))
                      .map((c) => c.name);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-500 tabular-nums">
                          {item.menuOrder}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="font-medium text-slate-900 hover:text-blue-700 text-left truncate block w-full"
                          >
                            {item.title}
                          </button>
                          <div className="text-xs text-slate-500 font-mono truncate">
                            /casehistory/{item.slug}/
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap tabular-nums">
                          {item.meta.codice || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 tabular-nums">
                          {item.meta.anno || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px] truncate">
                          {catNames.length > 0 ? catNames.join(', ') : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {renderStatusText(item.status)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600 whitespace-nowrap tabular-nums">
                          {formatShortDate(item.publishedAt)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 tabular-nums">
                          {item.views.toLocaleString('it-IT')}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              title="Anteprima"
                              aria-label={`Anteprima ${item.title}`}
                              onClick={() => onPreview(item)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              title="Modifica"
                              aria-label={`Modifica ${item.title}`}
                              onClick={() => onEdit(item)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              title="Duplica"
                              aria-label={`Duplica ${item.title}`}
                              onClick={() => onDuplicate(item)}
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              title="Elimina"
                              aria-label={`Elimina ${item.title}`}
                              onClick={() => onDelete(item.id)}
                              className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                      Nessuna Case History trovata con i filtri attuali.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Taxonomies Management (casehistory_cat & casehistory_tag) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form
            onSubmit={handleAddTerm}
            className="lg:col-span-4 space-y-4 rounded-xl border border-slate-200 bg-white p-6 h-fit"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-slate-900">
                Nuovo termine
              </h2>
              <div className="flex items-center gap-1 rounded-md bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setTaxonomyKind('cat')}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    taxonomyKind === 'cat' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Categoria
                </button>
                <button
                  type="button"
                  onClick={() => setTaxonomyKind('tag')}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    taxonomyKind === 'tag' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Tag
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="term-name" className="block text-xs font-medium text-slate-700">
                {taxonomyKind === 'cat' ? 'Nome della categoria *' : 'Nome del tag *'}
              </label>
              <input
                id="term-name"
                type="text"
                required
                value={termName}
                onChange={(e) => setTermName(e.target.value)}
                placeholder={taxonomyKind === 'cat' ? 'Es. Infrastrutture' : 'Es. Zero Emissioni'}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="term-slug" className="block text-xs font-medium text-slate-700">
                Slug (opzionale)
              </label>
              <input
                id="term-slug"
                type="text"
                value={termSlug}
                onChange={(e) => setTermSlug(e.target.value)}
                placeholder={termName ? slugify(termName) : 'generato-automaticamente'}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="term-parent" className="block text-xs font-medium text-slate-700">
                {taxonomyKind === 'cat' ? 'Categoria padre' : 'Tag padre'}
              </label>
              <select
                id="term-parent"
                value={termParentId}
                onChange={(e) => setTermParentId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">Nessuno (livello principale)</option>
                {activeTerms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="term-desc" className="block text-xs font-medium text-slate-700">
                Descrizione
              </label>
              <textarea
                id="term-desc"
                rows={2}
                value={termDesc}
                onChange={(e) => setTermDesc(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-700 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              {taxonomyKind === 'cat' ? 'Aggiungi nuova categoria' : 'Aggiungi nuovo tag'}
            </button>
          </form>

          <div className="lg:col-span-8 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <div className="font-display text-sm font-bold text-slate-900">
                {taxonomyKind === 'cat'
                  ? 'Tassonomia gerarchica: casehistory_cat'
                  : 'Tassonomia gerarchica: casehistory_tag'}
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {activeTerms.length} termini
              </span>
            </div>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Genitore</th>
                  <th className="px-4 py-3 text-right">Case History</th>
                  <th className="px-4 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeTerms.map((term) => {
                  const parent = activeTerms.find((p) => p.id === term.parentId);
                  const usageCount = items.filter((item) =>
                    taxonomyKind === 'cat'
                      ? item.categoryIds.includes(term.id)
                      : item.tagIds.includes(term.id),
                  ).length;
                  return (
                    <tr key={term.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {term.parentId ? `— ${term.name}` : term.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{term.slug}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {parent ? parent.name : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-slate-700 tabular-nums">
                        {usageCount}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          aria-label={`Elimina ${term.name}`}
                          onClick={() => handleDeleteTerm(term.id)}
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
