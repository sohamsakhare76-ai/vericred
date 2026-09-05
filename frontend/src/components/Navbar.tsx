import { Link, useLocation } from "react-router-dom";
import { WalletConnect } from "./WalletConnect";

const links = [
  { to: "/", label: "Home" },
  { to: "/issue", label: "Issue" },
  { to: "/verify", label: "Verify" },
  { to: "/admin", label: "Admin" },
];

export function Navbar() {
  const location = useLocation();

  return (
    <header className="border-b border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl font-semibold text-parchment">
            VeriCred
          </span>
        </Link>

        <nav className="hidden gap-8 sm:flex">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors ${
                  active
                    ? "text-seal-brass"
                    : "text-ink-muted hover:text-parchment"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <WalletConnect />
      </div>
    </header>
  );
}
