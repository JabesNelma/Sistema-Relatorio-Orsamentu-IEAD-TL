export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
        <p className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">Sistema Finansa</span>
          <span className="text-border">•</span>
          <span>Manejamentu Finansa Rejional Timor-Leste</span>
        </p>
        <p>© {year} Governu Timor-Leste — Direção Finansa</p>
      </div>
    </footer>
  );
}
