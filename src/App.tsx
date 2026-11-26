import { useCallback, useEffect, useState } from 'react';
import { TopBar, type AppSection } from './components/TopBar';
import { ShowcaseView } from './components/ShowcaseView';
import { AdminManagerView } from './components/AdminManagerView';
import { ShortcodeWidgetView } from './components/ShortcodeWidgetView';
import { PluginCodeView } from './components/PluginCodeView';
import { CaseDetailModal } from './components/CaseDetailModal';
import { CaseEditorModal } from './components/CaseEditorModal';
import { INITIAL_STORE_STATE } from './data/seedData';
import type {
  CaseHistoryItem,
  CaseHistoryStoreState,
  PluginOptions,
  TaxonomyTerm,
} from './types/caseHistory';

export default function App() {
  const [store, setStore] = useState<CaseHistoryStoreState>(INITIAL_STORE_STATE);
  const [activeSection, setActiveSection] = useState<AppSection>('vetrina');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
  const [detailCase, setDetailCase] = useState<CaseHistoryItem | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseHistoryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3200);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { state: CaseHistoryStoreState | null } | null) => {
        if (!active || !data?.state) return;
        setStore(data.state);
      })
      .catch(() => {
        // Fallback to initial seed state if server state is not yet written
      });
    return () => {
      active = false;
    };
  }, []);

  const persistStore = useCallback((nextState: CaseHistoryStoreState) => {
    setStore(nextState);
    fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextState),
    }).catch(() => {
      // Keep client state responsive even if persistence request is interrupted
    });
  }, []);

  const handleOpenCreate = () => {
    setEditingCase(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (item: CaseHistoryItem) => {
    setEditingCase(item);
    setEditorOpen(true);
  };

  const handleSelectCase = (item: CaseHistoryItem) => {
    const updatedItem = { ...item, views: item.views + 1 };
    const nextHistories = store.caseHistories.map((ch) =>
      ch.id === item.id ? updatedItem : ch,
    );
    persistStore({ ...store, caseHistories: nextHistories });
    setDetailCase(updatedItem);
  };

  const handleSaveCase = (saved: CaseHistoryItem) => {
    const exists = store.caseHistories.some((ch) => ch.id === saved.id);
    const nextHistories = exists
      ? store.caseHistories.map((ch) => (ch.id === saved.id ? saved : ch))
      : [saved, ...store.caseHistories];

    persistStore({ ...store, caseHistories: nextHistories });
    setEditorOpen(false);
    setEditingCase(null);

    if (exists) {
      showToast('Case History aggiornata.');
    } else if (saved.status === 'publish') {
      showToast('Case History pubblicata.');
    } else if (saved.status === 'draft') {
      showToast('Bozza Case History aggiornata.');
    } else {
      showToast('Case History schedulata.');
    }
  };

  const handleDuplicateCase = (item: CaseHistoryItem) => {
    const copy: CaseHistoryItem = {
      ...item,
      id: `ch-${Date.now()}`,
      title: `${item.title} (Copia)`,
      slug: `${item.slug}-copia`,
      status: 'draft',
      views: 0,
      menuOrder: store.caseHistories.length + 1,
      meta: {
        ...item.meta,
        codice: item.meta.codice ? `${item.meta.codice}-B` : '',
      },
    };
    persistStore({ ...store, caseHistories: [copy, ...store.caseHistories] });
    showToast('Case History duplicata come bozza.');
  };

  const handleDeleteCase = (id: string) => {
    const nextHistories = store.caseHistories.filter((ch) => ch.id !== id);
    persistStore({ ...store, caseHistories: nextHistories });
    if (detailCase?.id === id) setDetailCase(null);
    showToast('Case History eliminata.');
  };

  const handleSaveCategories = (categories: TaxonomyTerm[]) => {
    persistStore({ ...store, categories });
    showToast('Categorie aggiornate.');
  };

  const handleSaveTags = (tags: TaxonomyTerm[]) => {
    persistStore({ ...store, tags });
    showToast('Tag aggiornati.');
  };

  const handleSaveOptions = (options: PluginOptions) => {
    persistStore({ ...store, options });
    showToast('Opzioni plugin salvate.');
  };

  const handleSearchFromWidget = (categorySlug: string) => {
    setSelectedCategorySlug(categorySlug);
    setActiveSection('vetrina');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        onCreateNew={handleOpenCreate}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 rounded-lg border border-slate-200 bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg"
        >
          {toastMessage}
        </div>
      )}

      <main className="flex-1">
        {activeSection === 'vetrina' && (
          <ShowcaseView
            items={store.caseHistories}
            categories={store.categories}
            tags={store.tags}
            selectedCategorySlug={selectedCategorySlug}
            onCategoryChange={setSelectedCategorySlug}
            onSelectCase={handleSelectCase}
            onCreateNew={handleOpenCreate}
          />
        )}

        {activeSection === 'gestione' && (
          <AdminManagerView
            items={store.caseHistories}
            categories={store.categories}
            tags={store.tags}
            onCreateNew={handleOpenCreate}
            onEdit={handleOpenEdit}
            onPreview={handleSelectCase}
            onDuplicate={handleDuplicateCase}
            onDelete={handleDeleteCase}
            onSaveCategories={handleSaveCategories}
            onSaveTags={handleSaveTags}
          />
        )}

        {activeSection === 'shortcode' && (
          <ShortcodeWidgetView
            items={store.caseHistories}
            categories={store.categories}
            options={store.options}
            onSaveOptions={handleSaveOptions}
            onSelectCase={handleSelectCase}
            onSearchFromWidget={handleSearchFromWidget}
          />
        )}

        {activeSection === 'codice' && <PluginCodeView />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-5 text-xs text-slate-500">
          <div>
            Case History Studio — Basato sul plugin WordPress Case History (GPLv2)
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveSection('vetrina')}
              className="hover:text-slate-900"
            >
              Vetrina
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('gestione')}
              className="hover:text-slate-900"
            >
              Gestione CPT
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('codice')}
              className="hover:text-slate-900"
            >
              File /casehistory/
            </button>
          </div>
        </div>
      </footer>

      <CaseDetailModal
        item={detailCase}
        categories={store.categories}
        tags={store.tags}
        options={store.options}
        onClose={() => setDetailCase(null)}
        onEdit={handleOpenEdit}
      />

      <CaseEditorModal
        isOpen={editorOpen}
        editingItem={editingCase}
        categories={store.categories}
        tags={store.tags}
        onClose={() => {
          setEditorOpen(false);
          setEditingCase(null);
        }}
        onSave={handleSaveCase}
      />
    </div>
  );
}
