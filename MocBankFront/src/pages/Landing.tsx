import { Link } from "react-router-dom";

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path
      d="M16.7 6.1 8.5 14.3 3.3 9.1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card-elev p-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="step2">
      <div className="num">{n}</div>
      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-sm text-muted mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="relative">
      {/* miękkie tło */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="home-blob blob-1" />
        <div className="home-blob blob-2" />
      </div>

      {/* HERO */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-12 pb-10">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="badge-soft">Sandbox • API • Webhooki</span>
            <h1 className="mt-3 text-[32px] sm:text-5xl font-semibold leading-tight tracking-tight text-white">
              MockBank — sandbox do testów integracji bankowych
            </h1>
            <p className="mt-3 max-w-prose text-base leading-relaxed text-muted">
              Przetestuj przepływy: konta, transakcje, webhooki i symulacje
              wpływów. Zero ryzyka, pełna kontrola danych.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn-primary">
                Rozpocznij za darmo
              </Link>
              <Link to="/login" className="btn-ghost">
                Zaloguj się
              </Link>
            </div>

            <ul className="mt-5 grid gap-2 text-sm text-muted/90">
              <li className="flex items-center gap-2">
                <span className="check">
                  <Check />
                </span>
                Realistyczne dane demo (konta, salda, historia)
              </li>
              <li className="flex items-center gap-2">
                <span className="check">
                  <Check />
                </span>
                Webhooki: wpływy, obciążenia, zdarzenia bezpieczeństwa
              </li>
              <li className="flex items-center gap-2">
                <span className="check">
                  <Check />
                </span>
                Tryb developerski: szybkie odświeżanie i logi
              </li>
            </ul>
          </div>

          {/* Mock karty — mniejszy, bardziej „glass” */}
          <div className="md:justify-self-end">
            <div className="home-card-compact">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Saldo łączone</p>
                  <p className="mt-0.5 text-2xl font-semibold text-white">
                    24&nbsp;312,45 zł
                  </p>
                </div>
                <span className="badge-soft uppercase">sandbox</span>
              </div>

              <div className="mt-3 space-y-2">
                <div className="txn-row">
                  <span className="dot income" />
                  <span className="label">Wypłata</span>
                  <span className="amount income">+8 000,00</span>
                </div>
                <div className="txn-row">
                  <span className="dot expense" />
                  <span className="label">Zakupy</span>
                  <span className="amount">-254,90</span>
                </div>
                <div className="txn-row">
                  <span className="dot expense" />
                  <span className="label">Subskrypcja</span>
                  <span className="amount">-39,99</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FUNKCJE */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            title="Konta & salda"
            desc="Lista rachunków i aktualne salda — idealne do podglądów budżetu."
          />
          <Feature
            title="Transakcje"
            desc="Stronicowanie, filtry daty i typów. Realistyczne kategorie i kontrahenci."
          />
          <Feature
            title="Webhooki"
            desc="Subskrybuj zdarzenia i testuj integracje w czasie rzeczywistym."
          />
        </div>
      </section>

      {/* JAK TO DZIAŁA */}
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          Jak to działa?
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Step
            n={1}
            title="Załóż konto"
            desc="Rejestracja w 30 s. Dostęp do panelu i danych demo."
          />
          <Step
            n={2}
            title="Skonfiguruj webhook"
            desc="Podaj URL odbiornika. Otrzymasz eventy o wpływach/obciążeniach."
          />
          <Step
            n={3}
            title="Symuluj transakcje"
            desc="Generuj zdarzenia z panelu i testuj pełne przepływy."
          />
        </div>
      </section>
    </main>
  );
}
