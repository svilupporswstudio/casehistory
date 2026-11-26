import { useEffect, useState } from 'react';
import { FileCode2, Download, Copy, Check, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import type { PluginFileEntry } from '../types/caseHistory';

const PHP_DIAGNOSTICS = [
  {
    file: 'casehistory.php',
    line: 6,
    severity: 'Aggiornato',
    title: 'Versione 1.4, WP 7.0+ e dipendenza nativa Meta Box',
    detail:
      'Intestazione aggiornata con Version: 1.4, Requires at least: 7.0, Requires Plugins: meta-box e link ufficiale aggiornato.',
  },
  {
    file: 'casehistory_pluginaggiuntivi.php',
    line: 14,
    severity: 'Aggiornato',
    title: 'Rimossa attivazione forzata (TGMPA) — Uso API core WordPress',
    detail:
      'Sostituito TGM Plugin Activation e force_activation con controllo nativo is_plugin_active() e admin_notices per Meta Box.',
  },
  {
    file: 'casehistory_shortcode.php',
    line: 13,
    severity: 'Errore',
    title: 'Variabile di ritorno non definita ($strReturn)',
    detail:
      'La funzione accumula l’HTML in $casehistory_strReturn ma restituisce return $strReturn;. Correggere in return $casehistory_strReturn;.',
  },
  {
    file: 'casehistory_widget.php',
    line: 50,
    severity: 'Avviso',
    title: 'Slug tassonomia errato nel widget ("categoria")',
    detail:
      'get_terms("categoria") non coincide con la tassonomia registrata "casehistory_cat" in casehistory_tassonomie.php.',
  },
];

export function PluginCodeView() {
  const [files, setFiles] = useState<PluginFileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('casehistory.php');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/plugin-files')
      .then((res) => {
        if (!res.ok) throw new Error('Errore nel caricamento dei file del plugin');
        return res.json();
      })
      .then((data: { files: PluginFileEntry[] }) => {
        if (!active) return;
        setFiles(data.files || []);
        if (data.files?.some((f) => f.path === 'casehistory.php')) {
          setSelectedPath('casehistory.php');
        } else if (data.files?.[0]) {
          setSelectedPath(data.files[0].path);
        }
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedFile = files.find((f) => f.path === selectedPath) ?? null;

  const handleCopyCode = async () => {
    if (!selectedFile?.content) return;
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Codice Sorgente Plugin WordPress (/casehistory/)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tutti i file estratti dall’archivio allegato sono integrati nel progetto e consultabili
            direttamente qui.
          </p>
        </div>

        <a
          href="/api/plugin-archive"
          download="casehistory-plugin-wp-1.4.zip"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Scarica ZIP plugin v1.4</span>
        </a>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Caricamento dei file estratti in /casehistory/...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File tree */}
          <aside className="lg:col-span-4 rounded-xl border border-slate-200 bg-white overflow-hidden h-fit">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <span className="font-display text-xs font-bold text-slate-700">
                File estratti ({files.length})
              </span>
              <span className="font-mono text-xs text-slate-500">casehistory/</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
              {files.map((file) => {
                const isSelected = file.path === selectedPath;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedPath(file.path)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {file.isBinary ? (
                        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      ) : (
                        <FileCode2 className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      )}
                      <span className="truncate font-mono text-xs font-medium">{file.path}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                      {file.size >= 1024
                        ? `${(file.size / 1024).toFixed(1)} KB`
                        : `${file.size} B`}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Code / Asset Viewer */}
          <section className="lg:col-span-8 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-700 min-w-0">
                    <span className="font-semibold truncate">casehistory/{selectedFile.path}</span>
                    {!selectedFile.isBinary && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-500 tabular-nums">
                          {selectedFile.lines} righe
                        </span>
                      </>
                    )}
                  </div>
                  {selectedFile.content && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                      )}
                      <span>{copied ? 'Copiato' : 'Copia'}</span>
                    </button>
                  )}
                </div>

                {selectedFile.isBinary ? (
                  <div className="p-8 text-center space-y-4">
                    {selectedFile.previewUrl ? (
                      <div className="inline-block rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <img
                          src={selectedFile.previewUrl}
                          alt={selectedFile.name}
                          referrerPolicy="no-referrer"
                          className="max-h-48 mx-auto object-contain"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">
                        File binario compilato ({selectedFile.name}, {selectedFile.size} byte).
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="max-h-[540px] overflow-auto bg-slate-950 p-4 text-xs leading-6 text-slate-100 font-mono">
                    <table className="w-full border-collapse">
                      <tbody>
                        {(selectedFile.content || '').split(/\r?\n/).map((line, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/80">
                            <td className="select-none pr-4 text-right text-slate-500 tabular-nums align-top w-10">
                              {idx + 1}
                            </td>
                            <td className="whitespace-pre text-slate-100">{line || ' '}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-sm text-slate-500">Seleziona un file dalla lista.</div>
            )}
          </section>
        </div>
      )}

      {/* Real PHP Code Diagnostics */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden="true" />
          <h2 className="font-display text-base font-bold text-slate-900">
            Diagnostica automatica dei sorgenti PHP
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PHP_DIAGNOSTICS.map((diag) => (
            <button
              key={`${diag.file}-${diag.line}`}
              type="button"
              onClick={() => setSelectedPath(diag.file)}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-mono">
                <span className="font-semibold text-blue-700">
                  {diag.file}:{diag.line}
                </span>
                <span
                  className={
                    diag.severity === 'Errore'
                      ? 'font-semibold text-red-700'
                      : diag.severity === 'Avviso'
                        ? 'font-semibold text-amber-700'
                        : diag.severity === 'Aggiornato'
                          ? 'font-semibold text-emerald-700'
                          : 'font-semibold text-slate-600'
                  }
                >
                  {diag.severity}
                </span>
              </div>
              <div className="mt-1.5 text-sm font-semibold text-slate-900">{diag.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{diag.detail}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
