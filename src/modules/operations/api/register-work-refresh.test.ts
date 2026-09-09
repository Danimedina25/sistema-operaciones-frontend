import { QueryClient } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { api } from '@/shared/lib/axios';
import { registerWorkRefresh } from './register-work-refresh';
it.each(['validate', 'reject', 'realize', 'confirm', 'deliver'])('invalida pendientes después de %s', async (action) => {
  const client = new QueryClient(); client.setQueryData(['work-operations', 1], { totalElements: 1 }); client.setQueryData(['staff-deliveries', 1], { totalElements: 1 });
  const dispose = registerWorkRefresh(client);
  try {
    await api.patch(`/operations/test/${action}`, {}, { adapter: async (config) => ({ data: {}, status: 200, statusText: 'OK', headers: {}, config }) });
    expect(client.getQueryState(['work-operations', 1])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['staff-deliveries', 1])?.isInvalidated).toBe(true);
  } finally { dispose(); client.clear(); }
});
it('no invalida por una escritura fallida', async () => {
  const client = new QueryClient(); const spy = vi.spyOn(client, 'invalidateQueries'); const dispose = registerWorkRefresh(client);
  try { await expect(api.patch('/operations/test', {}, { adapter: async () => { throw new Error('failed'); } })).rejects.toThrow(); expect(spy).not.toHaveBeenCalled(); } finally { dispose(); client.clear(); }
});
