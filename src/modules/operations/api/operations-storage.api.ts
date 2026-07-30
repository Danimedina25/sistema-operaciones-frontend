import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
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