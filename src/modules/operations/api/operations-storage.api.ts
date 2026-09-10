import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { firebaseStorage } from '@/shared/lib/firebase';

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_');
}

export async function uploadOperationProof(params: {
  file: File;
  userId: number;
  operationId?: number;
  folder?: string;
}) {
  const { file, userId, operationId, folder: category = 'comprobantes' } = params;

  const timestamp = Date.now();
  const safeFileName = sanitizeFileName(file.name);

  const folder = operationId
    ? `${category}/operaciones/${operationId}`
    : `${category}/usuarios/${userId}/temporales`;

  const storageRef = ref(
    firebaseStorage,
    `${folder}/${timestamp}-${safeFileName}`,
  );

  await uploadBytes(storageRef, file);

  const downloadUrl = await getDownloadURL(storageRef);

  return {
    downloadUrl,
    fullPath: storageRef.fullPath,
    fileName: file.name,
  };
}

/**
 * Los comprobantes viven en Firebase Storage y los sube el navegador: el backend
 * solo guarda la URL, así que al eliminar una operación la limpieza del archivo
 * tiene que hacerse desde aquí.
 *
 * Borra el archivo concreto al que apunta la URL, nunca la carpeta de la
 * operación, para no arrastrar archivos que pertenezcan a otro registro.
 */
export async function deleteOperationProofByUrl(downloadUrl: string) {
  await deleteObject(ref(firebaseStorage, downloadUrl));
}
