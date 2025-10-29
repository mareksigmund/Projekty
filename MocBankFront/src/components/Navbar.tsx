import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { authStore } from "../lib/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isLoggedIn = !!authStore.token;

  const userLabel = useMemo(() => {
    const u = authStore.user;
    if (!u) return null;
    const name = (u.fullName || u.email || "").trim();
    return name || null;
  }, []);

  function handleLogout() {
    authStore.logout();
    setOpen(false);
    navigate("/login");
  }

  const link = ({ isActive }: { isActive: boolean }) =>
    [
      "nav-link",
      "px-3 py-2 rounded-md font-medium",
      isActive ? "nav-link-active" : "hover:bg-overlay/50",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/80 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center gap-3">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-[15px] font-semibold tracking-tight hover:bg-overlay/60"
          >
            {/* Prosta „kropka” jako pseudo-logo */}
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="text-white">MockBank</span>
            <span className="badge-soft">beta</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 ms-2">
            <NavLink to="/" className={link} end>
              Strona główna
            </NavLink>

            {isLoggedIn && (
              <>
                <NavLink to="/accounts" className={link}>
                  Konta
                </NavLink>
                {/* <NavLink to="/transactions" className={link}>
                  Transakcje
                </NavLink> */}
                <NavLink to="/webhooks" className={link}>
                  Webhooki
                </NavLink>
              </>
            )}
          </nav>

          {/* Right side (desktop) */}
          <div className="ms-auto hidden md:flex items-center gap-2">
            {!isLoggedIn ? (
              <>
                <NavLink to="/login" className="btn-ghost">
                  Zaloguj
                </NavLink>
                <NavLink to="/register" className="btn-primary">
                  Rejestracja
                </NavLink>
              </>
            ) : (
              <>
                {userLabel && (
                  <div className="hidden lg:flex items-center gap-2 rounded-lg border border-border bg-overlay/60 px-3 py-1.5 text-sm text-muted">
                    <div className="avatar">{userLabel[0]?.toUpperCase()}</div>
                    <span className="truncate max-w-[14rem]">{userLabel}</span>
                  </div>
                )}
                <button onClick={handleLogout} className="btn-primary">
                  Wyloguj
                </button>
              </>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="md:hidden rounded-lg border border-border bg-overlay/70 p-2"
            aria-label="Otwórz menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-border/70 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/75"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-3 flex flex-col gap-1">
            <NavLink to="/" className={link} onClick={() => setOpen(false)} end>
              Strona główna
            </NavLink>

            {isLoggedIn ? (
              <>
                <NavLink
                  to="/accounts"
                  className={link}
                  onClick={() => setOpen(false)}
                >
                  Konta
                </NavLink>
                <NavLink
                  to="/transactions"
                  className={link}
                  onClick={() => setOpen(false)}
                >
                  Transakcje
                </NavLink>
                <NavLink
                  to="/webhooks"
                  className={link}
                  onClick={() => setOpen(false)}
                >
                  Webhooki
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="btn-primary w-full mt-2"
                >
                  Wyloguj
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={link}
                  onClick={() => setOpen(false)}
                >
                  Zaloguj
                </NavLink>
                <NavLink
                  to="/register"
                  className={link}
                  onClick={() => setOpen(false)}
                >
                  Rejestracja
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
