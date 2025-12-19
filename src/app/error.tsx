'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-red-500">Oops!</h1>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-4">
          Algo deu errado
        </h2>
        <p className="text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
          Ocorreu um erro inesperado. Por favor, tente novamente.
        </p>
        <button
          onClick={() => reset()}
          className="inline-block mt-8 px-6 py-3 bg-[var(--accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
