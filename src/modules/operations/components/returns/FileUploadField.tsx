import { ReceiptUploadField } from '@/shared/components/ui/ReceiptUploadField';

interface FileUploadFieldProps {
  value?: FileList;
  onChange: (files: FileList | undefined) => void;
  selectedLabel?: string;
  dropHint?: string;
  accept?: string;
  inputId: string;
}

/** Adaptador de FileList para los formularios de retorno existentes. */
export function FileUploadField({
  value, onChange, selectedLabel, dropHint, accept, inputId,
}: FileUploadFieldProps) {
  const file = value?.[0] ?? null;
  return <ReceiptUploadField inputId={inputId} file={file} label="" selectedLabel={selectedLabel}
    dropHint={dropHint} accept={accept} onChange={next => {
      if (!next) { onChange(undefined); return; }
      const transfer = new DataTransfer();
      transfer.items.add(next);
      onChange(transfer.files);
    }} />;
}
