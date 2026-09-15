import type { ReturnPaymentType } from '@/shared/utils/form.utils';
import { validateDestinationAccountIdentifiers } from './return-destination-account';

export const RETURN_METHODS = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'RETIRO_SIN_TARJETA', label: 'Retiro sin tarjeta' },
] as const;
export const FIELDS = {
  monto: ['Monto', 'cantidad', 'importe'], tipoPago: ['Tipo de retorno', 'tipo de pago', 'tipo'],
  banco: ['Banco', 'banco destino'], titular: ['Titular', 'beneficiario', 'titular de la cuenta'],
  cuenta: ['Cuenta', 'tarjeta', 'cuenta o tarjeta', 'numero de cuenta', 'numero de tarjeta'],
  clabe: ['CLABE', 'clabe interbancaria'], observaciones: ['Observaciones'],
  autorizadoParaRecibirEfectivo1: ['Autorizado 1'], autorizadoParaRecibirEfectivo2: ['Autorizado 2'],
  autorizadoParaRecibirEfectivo3: ['Autorizado 3'],
};
export type Field = keyof typeof FIELDS;
export type PaymentDraft = Record<Field, string> & { tipoPago: '' | ReturnPaymentType };
export type DraftErrors = Partial<Record<Field, string>>;
export interface ExcelCell { value: string | number; unsafe?: string }
export interface ExcelRow { number: number; cells: ExcelCell[] }
export interface ExcelSheet { name: string; rows: ExcelRow[] }
export type ColumnMapping = Partial<Record<Field, number>>;
export interface ImportedPayment { draft: PaymentDraft; row: number; issues: DraftErrors; importIssues: DraftErrors }
export const normalizeHeader = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[_\s]+/g, ' ').trim();
export function detectColumns(row: ExcelRow): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const field of Object.keys(FIELDS) as Field[]) {
    const matches = row.cells.flatMap((cell, index) => FIELDS[field].some(alias => normalizeHeader(alias) === normalizeHeader(String(cell.value))) ? [index] : []);
    if (matches.length === 1) mapping[field] = matches[0];
  }
  return mapping;
}
export function parseExcelAmount(value: string | number): string {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 && Math.abs(value * 100 - Math.round(value * 100)) < 0.00001 && Number.isSafeInteger(Math.round(value * 100)) ? value.toFixed(2) : '';
  const text = value.trim().replace(/^(?:MXN\s*|\$\s*)/i, '').replace(/\s*MXN$/i, '').trim();
  let normalized = text;
  if (/^\d+(?:[.,]\d{1,2})?$/.test(text)) normalized = text.replace(',', '.');
  else if (/^\d{1,3}(?:,\d{3})+\.\d{1,2}$/.test(text)) normalized = text.replace(/,/g, '');
  else if (/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(text)) normalized = text.replace(/\./g, '').replace(',', '.');
  else return '';
  return parseExcelAmount(Number(normalized));
}
export function validateReturnDraft(pago: Partial<PaymentDraft>): DraftErrors {
  const errors: DraftErrors = {};
  const amount = Number(pago.monto?.replace(/,/g, ''));
  if (!Number.isFinite(amount) || amount <= 0) errors.monto = 'El monto debe ser mayor a cero';
  if (!pago.tipoPago) errors.tipoPago = 'El tipo de retorno es obligatorio';
  if (pago.tipoPago === 'TRANSFERENCIA' || pago.tipoPago === 'DEPOSITO') {
    if (!pago.banco?.trim()) errors.banco = 'El banco destino es obligatorio';
    if (!pago.titular?.trim()) errors.titular = 'El titular de la cuenta es obligatorio';
    Object.assign(errors, validateDestinationAccountIdentifiers(pago.cuenta, pago.clabe));
  }
  if ((pago.tipoPago === 'EFECTIVO' || pago.tipoPago === 'RETIRO_SIN_TARJETA') && ![pago.autorizadoParaRecibirEfectivo1, pago.autorizadoParaRecibirEfectivo2, pago.autorizadoParaRecibirEfectivo3].some(v => v?.trim())) errors.autorizadoParaRecibirEfectivo1 = 'Debes capturar al menos una persona autorizada para recibir efectivo';
  return errors;
}
export function extractPayments(sheet: ExcelSheet, header: number, mapping: ColumnMapping) {
  const payments: ImportedPayment[] = [];
  const skipped: number[] = [];
  for (const row of sheet.rows.filter(r => r.number > header)) {
    if (row.cells.some(cell => /^(?:total|totales|subtotal|total general|gran total)\s*:?$/i.test(String(cell.value).trim()))) { skipped.push(row.number); continue; }
    const draft = Object.fromEntries(Object.keys(FIELDS).map(field => [field, ''])) as PaymentDraft;
    const issues: DraftErrors = {};
    for (const field of Object.keys(FIELDS) as Field[]) {
      const index = mapping[field];
      const cell = index === undefined ? undefined : row.cells[index];
      if (!cell) continue;
      if (cell.unsafe) { issues[field] = cell.unsafe; continue; }
      if ((field === 'cuenta' || field === 'clabe') && typeof cell.value === 'number') {
        issues[field] = 'Identificador guardado como número: puede haber perdido ceros o precisión. Captúralo desde la fuente original.';
        continue;
      }
      if (field === 'monto') {
        draft.monto = parseExcelAmount(cell.value);
        if (!draft.monto) issues.monto = 'Monto inválido o ambiguo. Captura el importe correcto.';
      } else if (field === 'tipoPago') {
        const method = RETURN_METHODS.find(m => normalizeHeader(m.value) === normalizeHeader(String(cell.value)) || normalizeHeader(m.label) === normalizeHeader(String(cell.value)));
        draft.tipoPago = method?.value ?? '';
        if (!method) issues.tipoPago = 'Método desconocido o no habilitado. Selecciona un tipo de retorno.';
      } else {
        draft[field] = String(cell.value).trim();
        if ((field === 'cuenta' || field === 'clabe') && /[eE][+-]?\d+/.test(draft[field])) {
          draft[field] = ''; issues[field] = 'Identificador en notación científica. Captúralo desde la fuente original.';
        }
      }
    }
    if (draft.tipoPago === 'EFECTIVO' || draft.tipoPago === 'RETIRO_SIN_TARJETA') {
      for (const field of ['banco', 'titular', 'cuenta', 'clabe'] as const) { draft[field] = ''; delete issues[field]; }
    } else if (draft.tipoPago === 'TRANSFERENCIA') {
      for (const field of ['autorizadoParaRecibirEfectivo1', 'autorizadoParaRecibirEfectivo2', 'autorizadoParaRecibirEfectivo3'] as const) { draft[field] = ''; delete issues[field]; }
    }
    payments.push({ draft, row: row.number, importIssues: issues, issues: { ...validateReturnDraft(draft), ...issues } });
  }
  return { payments, skipped, total: payments.reduce((sum, p) => sum + Number(p.draft.monto), 0) };
}
export async function readReturnExcel(file: File): Promise<ExcelSheet[]> {
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Selecciona un archivo .xlsx.');
  if (!file.size) throw new Error('El archivo está vacío.');
  if (file.size > 5 * 1024 * 1024) throw new Error('El archivo excede el límite de 5 MB.');
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  try { await workbook.xlsx.load(await file.arrayBuffer()); }
  catch { throw new Error('No se pudo leer el Excel. Verifica que no esté dañado ni protegido con contraseña.'); }
  const sheets: ExcelSheet[] = [];
  for (const sheet of workbook.worksheets) {
    if (sheet.rowCount > 1001 || sheet.columnCount > 50) throw new Error('Usa un Excel de hasta 1,000 filas de datos y 50 columnas por hoja.');
    const rows: ExcelRow[] = [];
    sheet.eachRow((row, number) => {
      const cells: ExcelCell[] = Array.from({ length: sheet.columnCount }, (_, i) => {
        const cell = row.getCell(i + 1);
        const value = cell.value;
        if (value === null || value === undefined) return { value: '' };
        if (typeof value === 'string' || typeof value === 'number') return { value };
        if (typeof value === 'object' && 'richText' in value) return { value: value.richText.map(part => part.text).join('') };
        return { value: '', unsafe: 'La celda contiene una fórmula o un valor incompatible. Captura el dato manualmente.' };
      });
      if (cells.some(c => c.value !== '' || c.unsafe)) rows.push({ number, cells });
    });
    if (rows.length) sheets.push({ name: sheet.name, rows });
  }
  if (!sheets.length) throw new Error('El Excel no contiene datos.');
  return sheets;
}
export async function createReturnTemplate() {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Retornos');
  sheet.columns = Object.keys(FIELDS).map(key => ({ header: FIELDS[key as Field][0], key, width: 25, style: { numFmt: key === 'monto' ? '0.00' : '@' } }));
  sheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}
