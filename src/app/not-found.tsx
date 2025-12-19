import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-[var(--accent-primary)]">404</h1>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-4">
          Página não encontrada
        </h2>
        <p className="text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 px-6 py-3 bg-[var(--accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors"
        >
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
