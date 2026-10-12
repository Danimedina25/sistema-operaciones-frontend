import { beforeEach, expect, it, vi } from 'vitest';
import { searchStalledOperations } from './operations.api';

const get = vi.hoisted(() => vi.fn());
vi.mock('@/shared/lib/axios', () => ({ api: { get } }));

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: { data: { content: [], totalElements: 0, totalPages: 0 } } });
});

it('envía la búsqueda de Detenidas al servidor antes de paginar', async () => {
  await searchStalledOperations('Cliente objetivo', 2, 10);
  expect(get).toHaveBeenCalledWith('/api/operations/stalled/search?search=Cliente+objetivo&page=2&size=10');
});
