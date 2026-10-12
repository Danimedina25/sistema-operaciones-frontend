import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { FileUploadField } from './FileUploadField';

it('entrega un FileList al formulario existente y permite quitar el archivo', () => {
  class TestDataTransfer {
    files = Object.create(FileList.prototype) as FileList;
    items = { add: (next: File) => {
      Object.defineProperties(this.files, {
        0: { value: next, configurable: true },
        length: { value: 1, configurable: true },
      });
    } };
  }
  vi.stubGlobal('DataTransfer', TestDataTransfer);
  const onChange = vi.fn();
  const file = new File(['comprobante'], 'ingreso.pdf', { type: 'application/pdf' });
  const view = render(<FileUploadField inputId="ingreso" value={undefined} onChange={onChange}
    dropHint="Subir comprobante" />);
  fireEvent.change(screen.getByLabelText('Subir comprobante', { selector: 'input' }),
    { target: { files: [file] } });
  expect(onChange.mock.lastCall?.[0]).toBeInstanceOf(FileList);
  expect(onChange.mock.lastCall?.[0][0]).toBe(file);
  view.rerender(<FileUploadField inputId="ingreso" value={onChange.mock.lastCall?.[0]}
    onChange={onChange} dropHint="Subir comprobante" />);
  expect(screen.getByText('ingreso.pdf')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Quitar' }));
  expect(onChange).toHaveBeenLastCalledWith(undefined);
  vi.unstubAllGlobals();
});
