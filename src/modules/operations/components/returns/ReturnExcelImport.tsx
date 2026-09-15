import { useMemo, useRef, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { createReturnTemplate, detectColumns, extractPayments, FIELDS, readReturnExcel } from '../../utils/return-excel';
import type { ColumnMapping, ExcelSheet, Field, ImportedPayment } from '../../utils/return-excel';

export function ReturnExcelImport({ onImport, disabled, currentTotal, available }: {
  onImport: (payments: ImportedPayment[], sheet: string) => void;
  disabled: boolean; currentTotal: number; available: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const applied = useRef(false);
  const [sheets, setSheets] = useState<ExcelSheet[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [header, setHeader] = useState(1);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sheet = sheets[sheetIndex];
  const preview = useMemo(() => sheet ? extractPayments(sheet, header, mapping) : null, [sheet, header, mapping]);
  const duplicateMapping = new Set(Object.values(mapping)).size !== Object.values(mapping).length;
  function selectSheet(next: ExcelSheet[], index: number) {
    setSheetIndex(index);
    const row = next[index].rows[0];
    setHeader(row.number);
    setMapping(detectColumns(row));
  }
  async function load(file?: File) {
    if (!file) return;
    setBusy(true); setError(''); setSheets([]); applied.current = false;
    try { const next = await readReturnExcel(file); setSheets(next); selectSheet(next, 0); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo leer el archivo.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  }
  async function download() {
    setBusy(true); setError('');
    try {
      const buffer = await createReturnTemplate();
      const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const link = document.createElement('a'); link.href = url; link.download = 'plantilla-retornos.xlsx'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError('No se pudo descargar la plantilla. Intenta nuevamente.'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-3 rounded-xl border border-slate-200 p-4" aria-label="Importación de retornos">
    <div className="flex flex-wrap gap-3">
      <Button type="button" disabled={disabled || busy} onClick={() => input.current?.click()}>Importar desde Excel</Button>
      <Button type="button" disabled={disabled || busy} onClick={download}>Descargar plantilla</Button>
    </div>
    <input ref={input} type="file" accept=".xlsx" aria-label="Archivo Excel de retornos" className="sr-only" disabled={disabled || busy} onChange={e => void load(e.target.files?.[0])} />
    <p className="text-xs text-slate-500">Excel .xlsx, hasta 5 MB y 1,000 filas. Guarda cuenta, tarjeta y CLABE como texto. Importar no registra los retornos.</p>
    {busy && <p role="status">Procesando Excel…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {sheet && preview && <div className="space-y-3">
      <label className="block text-sm">Hoja
        <select className="ml-2 rounded border p-2" value={sheetIndex} onChange={e => selectSheet(sheets, Number(e.target.value))}>
          {sheets.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
        </select>
      </label>
      <label className="block text-sm">Fila de encabezados
        <select className="ml-2 rounded border p-2" value={header} onChange={e => { const row = sheet.rows.find(r => r.number === Number(e.target.value))!; setHeader(row.number); setMapping(detectColumns(row)); }}>
          {sheet.rows.map(row => <option key={row.number} value={row.number}>Fila {row.number}</option>)}
        </select>
      </label>
      <p className="text-sm">Revisa la asignación de columnas. Los campos sin columna se podrán completar en el formulario.</p>
      <div className="grid gap-2 md:grid-cols-3">
        {(Object.keys(FIELDS) as Field[]).map(field => <label key={field} className="text-sm">{FIELDS[field][0]}
          <select aria-label={`Columna para ${FIELDS[field][0]}`} className="block w-full rounded border p-2" value={mapping[field] ?? ''} onChange={e => setMapping(current => { const next = { ...current }; if (e.target.value === '') delete next[field]; else next[field] = Number(e.target.value); return next; })}>
            <option value="">Sin asignar</option>
            {sheet.rows.find(r => r.number === header)?.cells.map((cell, i) => <option key={i} value={i}>{i + 1}: {String(cell.value) || '(sin encabezado)'}</option>)}
          </select>
        </label>)}
      </div>
      {duplicateMapping && <p role="alert">Asigna cada columna a un solo campo.</p>}
      <p className="text-sm font-medium">{preview.payments.length} pagos detectados · Importe identificado: ${preview.total.toFixed(2)} · {preview.payments.filter(p => Object.keys(p.issues).length).length} filas con incidencias</p>
      {preview.total + currentTotal > available && <p role="alert" className="text-sm text-red-700">El total junto con los pagos capturados excede el monto disponible. Corrige los importes antes de registrar.</p>}
      {!!preview.skipped.length && <p className="text-sm">Filas de totales omitidas: {preview.skipped.join(', ')}.</p>}
      <ul className="max-h-48 overflow-auto text-sm text-amber-800">
        {preview.payments.flatMap(p => Object.entries(p.issues).map(([field, message]) => <li key={`${p.row}-${field}`}>Fila {p.row} · {FIELDS[field as Field][0]}: {message}</li>))}
      </ul>
      <div className="flex gap-3">
        <Button type="button" disabled={disabled || busy || duplicateMapping || !preview.payments.length || !Object.keys(mapping).length} onClick={() => {
          if (applied.current) return;
          applied.current = true; onImport(preview.payments, sheet.name); setSheets([]);
        }}>Prellenar retornos</Button>
        <Button type="button" onClick={() => setSheets([])}>Cancelar importación</Button>
      </div>
    </div>}
  </section>;
}
