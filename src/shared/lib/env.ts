const env = {
  apiUrl: import.meta.env.VITE_API_URL as string,
};

if (!env.apiUrl) {
  throw new Error('Falta la variable de entorno VITE_API_URL');
}

export { env };