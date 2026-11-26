import { useState, type FormEvent } from 'react';
import { Copy, Check, Search, Eye, EyeOff } from 'lucide-react';
import type { CaseHistoryItem, PluginOptions, TaxonomyTerm } from '../types/caseHistory';
import { formatItalianDate } from '../utils/wpHelpers';

interface ShortcodeWidgetViewProps {
  items: CaseHistoryItem[];
  categories: TaxonomyTerm[];
  options: PluginOptions;
  onSaveOptions: (options: PluginOptions) => void;
  onSelectCase: (item: CaseHistoryItem) => void;
  onSearchFromWidget: (categorySlug: string) => void;
}

const PLUGIN_REQUIREMENTS = [
  {
    name: 'Meta Box',
    slug: 'meta-box',
    version: 'Consigliato / Richiesto',
    mechanism: 'Requires Plugins: meta-box (WordPress Core)',
    role: 'Gestione Meta Box personalizzati (codice, anno, galleria, allegati PDF, video oEmbed). Nessuna attivazione forzata.',
  },
  {
    name: 'WordPress Core',
    slug: 'wordpress',
    version: '7.0 — 7.2',
    mechanism: 'Requires at least: 7.0 · Tested up to: 7.2',
    role: 'Plugin Case History v1.4 aggiornato per le API native di gestione dipendenze di WordPress.',
  },
];

export function ShortcodeWidgetView({
  items,
  categories,
  options,
  onSaveOptions,
  onSelectCase,
  onSearchFromWidget,
}: ShortcodeWidgetViewProps) {
  const [copiedShortcode, setCopiedShortcode] = useState(false);
  const [widgetTitle, setWidgetTitle] = useState('Ricerca Case History');
  const [widgetCategorySlug, setWidgetCategorySlug] = useState('');
  const [formOptions, setFormOptions] = useState<PluginOptions>(options);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [optionsSavedBanner, setOptionsSavedBanner] = useState(false);

  const latestTen = items
    .filter((i) => i.status === 'publish')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 10);

  const handleCopyShortcode = async () => {
    try {
      await navigator.clipboard.writeText('[casehistory_ultimecasehistoryinserite]');
      setCopiedShortcode(true);
      setTimeout(() => setCopiedShortcode(false), 1800);
    } catch {
      // Clipboard API fallback ignored cleanly
    }
  };

  const handleWidgetSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearchFromWidget(widgetCategorySlug);
  };

  const handleOptionsSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSaveOptions(formOptions);
    setOptionsSavedBanner(true);
    setTimeout(() => setOptionsSavedBanner(false), 2500);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10 space-y-10">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Shortcode, Widget &amp; Opzioni Plugin
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Anteprima interattiva dei moduli frontend del plugin: casehistory_shortcode.php,
          casehistory_widget.php, casehistory_opzioni.php e TGMPA.
        </p>
      </div>

      {/* Row 1: Shortcode + Widget Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Shortcode Simulator */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Shortcode ultime Case History inserite
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Riproduce casehistory_shortcode.php (posts_per_page: 10, post_type: casehistory).
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyShortcode}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-800 hover:bg-slate-100"
            >
              {copiedShortcode ? (
                <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              )}
              <span>[casehistory_ultimecasehistoryinserite]</span>
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Ultime Case History inserite
            </h3>
            {latestTen.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {latestTen.map((item) => (
                  <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="text-xs text-slate-500 tabular-nums">
                      {formatItalianDate(item.publishedAt)}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectCase(item)}
                      className="mt-0.5 text-sm font-semibold text-blue-700 hover:underline text-left"
                    >
                      {item.title}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Nessuna Case History pubblicata.</p>
            )}
          </div>
        </section>

        {/* Widget Simulator */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-5 h-fit">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Case History Widget
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulazione interattiva di casehistory_widget.php: personalizza il titolo e testa la
              ricerca nella Vetrina.
            </p>
          </div>

          <div>
            <label htmlFor="widget-title-cfg" className="block text-xs font-medium text-slate-700">
              Titolo ricerca (istanza widget)
            </label>
            <input
              id="widget-title-cfg"
              type="text"
              value={widgetTitle}
              onChange={(e) => setWidgetTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none"
            />
          </div>

          <form
            onSubmit={handleWidgetSubmit}
            className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4"
          >
            <h3 className="font-display text-sm font-bold text-slate-900">
              {widgetTitle.trim() || 'Ricerca Case History'}
            </h3>
            <div>
              <label htmlFor="widget-cat-select" className="sr-only">
                Scegli una categoria
              </label>
              <select
                id="widget-cat-select"
                value={widgetCategorySlug}
                onChange={(e) => setWidgetCategorySlug(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Scegli una categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.parentId ? `— ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cerca nella Vetrina</span>
            </button>
          </form>
        </section>
      </div>

      {/* Row 2: Plugin Options (casehistory_opzioni.php) & Required Plugins (TGMPA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <form
          onSubmit={handleOptionsSubmit}
          className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Opzioni plugin Case History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Impostazioni Social e configurazione SMTP da casehistory_opzioni.php.
              </p>
            </div>
            {optionsSavedBanner && (
              <span className="text-xs font-medium text-emerald-700">Opzioni salvate</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="opt-fb" className="block text-xs font-medium text-slate-700">
                Indirizzo Facebook
              </label>
              <input
                id="opt-fb"
                type="url"
                value={formOptions.facebook}
                onChange={(e) => setFormOptions({ ...formOptions, facebook: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="opt-yt" className="block text-xs font-medium text-slate-700">
                Indirizzo YouTube
              </label>
              <input
                id="opt-yt"
                type="url"
                value={formOptions.youtube}
                onChange={(e) => setFormOptions({ ...formOptions, youtube: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="opt-tw" className="block text-xs font-medium text-slate-700">
                Indirizzo Twitter / X
              </label>
              <input
                id="opt-tw"
                type="url"
                value={formOptions.twitter}
                onChange={(e) => setFormOptions({ ...formOptions, twitter: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="opt-gp" className="block text-xs font-medium text-slate-700">
                Indirizzo Google+
              </label>
              <input
                id="opt-gp"
                type="url"
                value={formOptions.googleplus}
                onChange={(e) => setFormOptions({ ...formOptions, googleplus: e.target.value })}
                placeholder="Opzionale"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5 space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Configurazione invio email SMTP
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="opt-smtp-host" className="block text-xs font-medium text-slate-700">
                  Host SMTP
                </label>
                <input
                  id="opt-smtp-host"
                  type="text"
                  value={formOptions.smtpHost}
                  onChange={(e) => setFormOptions({ ...formOptions, smtpHost: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="opt-smtp-user" className="block text-xs font-medium text-slate-700">
                  User SMTP
                </label>
                <input
                  id="opt-smtp-user"
                  type="text"
                  value={formOptions.smtpUser}
                  onChange={(e) => setFormOptions({ ...formOptions, smtpUser: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="opt-smtp-pass" className="block text-xs font-medium text-slate-700">
                  Password SMTP
                </label>
                <div className="relative mt-1">
                  <input
                    id="opt-smtp-pass"
                    type={showSmtpPassword ? 'text' : 'password'}
                    value={formOptions.smtpPassword}
                    onChange={(e) =>
                      setFormOptions({ ...formOptions, smtpPassword: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 pl-3 pr-9 py-2 font-mono text-xs text-slate-900"
                  />
                  <button
                    type="button"
                    aria-label={showSmtpPassword ? 'Nascondi password' : 'Mostra password'}
                    onClick={() => setShowSmtpPassword((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showSmtpPassword ? (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Salva opzioni plugin
            </button>
          </div>
        </form>

        {/* WordPress Core Plugin Dependencies */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-4 h-fit">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Requisiti Plugin (WordPress Core)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dipendenza gestita nativamente tramite header Requires Plugins: meta-box (nessuna
              attivazione forzata).
            </p>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
            {PLUGIN_REQUIREMENTS.map((plugin) => (
              <div key={plugin.slug} className="p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-semibold text-slate-900">
                    {plugin.name}
                  </span>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {plugin.version}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{plugin.role}</p>
                <div className="text-xs text-slate-500 font-mono">{plugin.mechanism}</div>
              </div>
            ))}
          </div>

          <div className="pt-1 text-xs text-slate-500">
            Pagina plugin:{' '}
            <a
              href="https://www.matteotestoni.it/servizi/programmatore-esperto-wordpress/plugin-case-history-wordpress/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline break-all"
            >
              matteotestoni.it/.../plugin-case-history-wordpress/
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
