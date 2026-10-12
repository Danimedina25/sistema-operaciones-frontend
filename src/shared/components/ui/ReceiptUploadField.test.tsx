import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ReceiptUploadField } from './ReceiptUploadField';

it('valida el tipo y tamaño, ofrece cámara y permite reemplazar el comprobante', () => {
  const onChange = vi.fn();
  const view = render(<ReceiptUploadField file={null} onChange={onChange} maxBytes={1_048_576} />);
  expect(document.querySelector('input[capture="environment"]')).toHaveAttribute('accept', 'image/*');
  const input = document.querySelector<HTMLInputElement>('input[accept=".pdf,.jpg,.jpeg,.png,.webp"]')!;
  fireEvent.change(input, { target: { files: [new File(['x'], 'archivo.txt', { type: 'text/plain' })] } });
  expect(screen.getByRole('alert')).toHaveTextContent('tipo permitido');
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { files: [new File([new Uint8Array(1_048_577)], 'grande.pdf', { type: 'application/pdf' })] } });
  expect(screen.getByRole('alert')).toHaveTextContent('1 MB');
  const pdf = new File(['pdf'], 'comprobante.pdf', { type: 'application/pdf' });
  fireEvent.change(input, { target: { files: [pdf] } });
  expect(onChange).toHaveBeenLastCalledWith(pdf);
  view.rerender(<ReceiptUploadField file={pdf} onChange={onChange} maxBytes={1_048_576} />);
  expect(screen.getByText('comprobante.pdf')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Quitar' }));
  expect(onChange).toHaveBeenLastCalledWith(null);
});
