import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDGBBlUKP8fmxJRRpO3lOTXp3Kz-XIHzH0",
  authDomain: "sistema-de-operaciones.firebaseapp.com",
  projectId: "sistema-de-operaciones",
  storageBucket: "sistema-de-operaciones.firebasestorage.app",
  messagingSenderId: "698626770080",
  appId: "1:698626770080:web:d7baa05efee79f7f77b5c5",
  measurementId: "G-7B2BDP1Z89"
};

const firebaseApp = initializeApp(firebaseConfig);

export const firebaseStorage = getStorage(firebaseApp);