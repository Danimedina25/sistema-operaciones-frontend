import { Link } from 'react-router-dom';
import { paths, buildOperationDetailPath } from '@/routes/paths';
import { currency } from '@/modules/caja-general/utils/cash-amounts';
import { formatCashDateTime } from '@/modules/caja-general/utils/cash-dates';
import { formatBankAccountLabel } from '@/shared/utils/bank-account-label';
import {
  BANK_MOVEMENT_ORIGINS,
  BANK_MOVEMENT_TYPES,
  type BankMovement,
} from '../types/bank-movements.types';

/** Enlace al origen real del movimiento, para poder auditarlo. */
function Reference({ movement }: { movement: BankMovement }) {
  if (movement.operacionId) {
    return (
      <Link to={buildOperationDetailPath(movement.operacionId)} className="text-slate-700 underline">
        Operación #{movement.operacionId}
        {movement.parcialidadId ? ` · Parcialidad #${movement.parcialidadId}` : ''}
      </Link>
    );
  }
  if (movement.cashMovementId) {
    return (
      <Link to={paths.cajaGeneral} className="text-slate-700 underline">
        Caja General · Registro #{movement.cashMovementId}
      </Link>
    );
  }
  return <span className="text-slate-400">—</span>;
}

/**
 * Historial cronológico de movimientos bancarios. Es una vista de consulta: aquí no hay
 * ninguna acción de captura, porque todo movimiento nace de un pago, de un retorno o de un
 * cheque cobrado en Caja General.
 */
export function BankMovementsTable({ movements }: { movements: BankMovement[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[56rem] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Fecha y hora</th>
            <th className="px-4 py-3">Dirección</th>
            <th className="px-4 py-3 text-right">Importe</th>
            <th className="px-4 py-3">Concepto</th>
            <th className="px-4 py-3">Cuenta</th>
            <th className="px-4 py-3">Origen</th>
            <th className="px-4 py-3">Referencia</th>
            <th className="px-4 py-3">Usuario</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {movements.map(movement => {
            const incoming = movement.direccion === 'ENTRADA';
            return (
              <tr key={movement.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {formatCashDateTime(movement.fecha)}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    incoming ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {incoming ? 'Entrada' : 'Salida'}
                  </span>
                </td>
                <td className={`whitespace-nowrap px-4 py-3 text-right tabular-nums font-medium ${
                  incoming ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {incoming ? '' : '−'}{currency(movement.monto)}
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {movement.concepto}
                  <span className="block text-xs text-slate-500">
                    {BANK_MOVEMENT_TYPES[movement.tipo] ?? movement.tipo}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {formatBankAccountLabel({
                    titular: movement.cuentaTitular,
                    banco: movement.cuentaBanco,
                    numeroCuenta: movement.cuentaNumero,
                  })}
                  {!movement.cuentaActiva && (
                    <span className="ml-2 text-xs text-amber-600">(inactiva)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{BANK_MOVEMENT_ORIGINS[movement.origen]}</td>
                <td className="px-4 py-3"><Reference movement={movement} /></td>
                <td className="px-4 py-3 text-slate-600">
                  {movement.usuarioNombre ?? (movement.usuarioId ? `Usuario #${movement.usuarioId}` : '—')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
