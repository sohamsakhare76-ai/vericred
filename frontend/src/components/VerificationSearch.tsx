import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function VerificationSearch() {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = query.trim();

    if (ADDRESS_RE.test(trimmed)) {
      navigate(`/verify/wallet/${trimmed}`);
      return;
    }
    if (trimmed !== "" && !isNaN(Number(trimmed))) {
      navigate(`/verify/${trimmed}`);
      return;
    }
    setError("Enter a token ID (e.g. 1) or a wallet address (0x...).");
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          className="flex-1 border border-white/15 bg-transparent px-4 py-3 text-sm text-parchment placeholder:text-ink-muted focus:border-seal-brass"
          placeholder="Token ID or wallet address (0x...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="border border-seal-brass px-6 py-3 text-sm text-seal-brass hover:bg-seal-brass hover:text-ink transition-colors"
        >
          Verify
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-seal-revoked">{error}</p>}
    </div>
  );
}
