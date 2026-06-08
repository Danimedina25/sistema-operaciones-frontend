export function capitalizeWords(value: string): string {
  return value
    .split(' ')
    .map((word) => {
      if (!word) return word;

      return (
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
      );
    })
    .join(' ');
}

export const capitalizeOnChange =
  (setValue: any, field: string) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(
      field,
      capitalizeWords(e.target.value),
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  };