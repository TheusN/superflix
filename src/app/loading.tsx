export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[var(--text-secondary)] mt-4">Carregando...</p>
      </div>
    </div>
  );
}
