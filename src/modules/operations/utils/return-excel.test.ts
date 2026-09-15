import { describe, expect, it } from 'vitest';
import { Workbook } from 'exceljs';
import { createReturnTemplate, detectColumns, extractPayments, parseExcelAmount, readReturnExcel } from './return-excel';
import type { ExcelSheet } from './return-excel';

describe('importación de retornos', () => {
  it('normaliza encabezados y deja duplicados para asignación manual', () => {
    expect(detectColumns({ number: 1, cells: ['  CANTIDAD ', 'Tipo de PÁGO', 'CLABE', 'Cuenta', 'Tarjeta'].map(value => ({ value })) })).toEqual({ monto: 0, tipoPago: 1, clabe: 2 });
  });
  it.each([[1000.5, '1000.50'], ['$1,000.50', '1000.50'], ['1.000,50', '1000.50'], ['1000,50', '1000.50'], ['1,000', ''], [-1, ''], ['no', ''], [Infinity, ''], [1.234, '']])('interpreta %s sin adivinar importes ambiguos', (value, expected) => {
    expect(parseExcelAmount(value)).toBe(expected);
  });
  it('conserva identificadores de texto, reporta pérdida potencial y omite totales', () => {
    const sheet: ExcelSheet = { name: 'Retornos', rows: [
      { number: 1, cells: ['Monto', 'Tipo', 'CLABE'].map(value => ({ value })) },
      { number: 2, cells: [100, 'transferencia', '001234567890123456'].map(value => ({ value })) },
      { number: 3, cells: [200, 'deposito', Number('123456789012345670')].map(value => ({ value })) },
      { number: 4, cells: ['Total', 300].map(value => ({ value })) },
    ] };
    const result = extractPayments(sheet, 1, detectColumns(sheet.rows[0]));
    expect(result.payments).toHaveLength(2);
    expect(result.payments[0].draft.clabe).toBe('001234567890123456');
    expect(result.payments[0].issues.banco).toBeTruthy();
    expect(result.payments[1].draft.tipoPago).toBe('');
    expect(result.payments[1].draft.clabe).toBe('');
    expect(result.payments[1].issues.clabe).toContain('precisión');
    expect(result.skipped).toEqual([4]);
    expect(result.total).toBe(300);
  });
  it('lee varias hojas, ignora vacíos y no importa resultados de fórmulas', async () => {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Uno');
    sheet.addRow(['Monto', 'Tipo de retorno', 'Cuenta']);
    sheet.addRow([{ formula: '1+1', result: 2 }, 'Transferencia', '0001234567']);
    sheet.addRow([]);
    workbook.addWorksheet('Dos').addRow(['Monto']);
    const buffer = await workbook.xlsx.writeBuffer();
    const file = new File([new Uint8Array(buffer)], 'retornos.xlsx');
    file.arrayBuffer = async () => new Uint8Array(buffer).buffer;
    const sheets = await readReturnExcel(file);
    expect(sheets).toHaveLength(2);
    expect(sheets[0].rows).toHaveLength(2);
    const result = extractPayments(sheets[0], 1, detectColumns(sheets[0].rows[0]));
    expect(result.payments[0].draft.monto).toBe('');
    expect(result.payments[0].issues.monto).toContain('fórmula');
    expect(result.payments[0].draft.cuenta).toBe('0001234567');
  });
  it('genera una plantilla con columnas bancarias de texto', async () => {
    const workbook = new Workbook();
    await workbook.xlsx.load(await createReturnTemplate());
    expect(workbook.worksheets[0].getColumn('E').numFmt).toBe('@');
    expect(workbook.worksheets[0].getColumn('F').numFmt).toBe('@');
  });
  it('rechaza archivos incompatibles, vacíos, grandes y dañados', async () => {
    await expect(readReturnExcel(new File(['x'], 'a.csv'))).rejects.toThrow('.xlsx');
    await expect(readReturnExcel(new File([], 'a.xlsx'))).rejects.toThrow('vacío');
    await expect(readReturnExcel(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'a.xlsx'))).rejects.toThrow('5 MB');
    const file = new File(['bad'], 'a.xlsx'); file.arrayBuffer = async () => new Uint8Array([1, 2]).buffer;
    await expect(readReturnExcel(file)).rejects.toThrow('No se pudo leer');
  });
});
