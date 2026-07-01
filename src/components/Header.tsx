import { ScanSearch } from "lucide-react";

/**
 * En-tête de l'application : logo + titre + accroche.
 */
export default function Header() {
  return (
    <header className="flex flex-col items-center gap-4 pt-14 pb-10 px-4 text-center animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-soft shadow-lg shadow-accent/30">
          <ScanSearch className="h-6 w-6 text-white" strokeWidth={2.2} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          QC <span className="text-accent-soft">AI</span>
        </h1>
      </div>
      <p className="max-w-xl text-sm text-muted sm:text-base">
        Uploadez les photos de votre produit et laissez l&apos;intelligence artificielle
        rendre un verdict de contrôle qualité en quelques secondes.
      </p>
    </header>
  );
}
