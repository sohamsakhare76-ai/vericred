import { StatusBadge } from "./StatusBadge";

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function IssuerStatus({
  address,
  isAuthorized,
  loading,
}: {
  address: string;
  isAuthorized: boolean | null;
  loading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-white/10 px-5 py-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Connected wallet
        </p>
        <p className="font-mono text-sm">{shorten(address)}</p>
      </div>
      {loading ? (
        <p className="text-sm text-ink-muted">Checking issuer status...</p>
      ) : (
        <StatusBadge status={isAuthorized ? "authorized" : "unauthorized"} />
      )}
    </div>
  );
}
