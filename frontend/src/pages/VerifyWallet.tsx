import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getReadOnlyProvider } from "../lib/readOnlyProvider";
import { getContract } from "../lib/contract";
import { fetchMetadata } from "../lib/ipfs";
import { StatusBadge } from "../components/StatusBadge";
import { CONTRACT_ADDRESS } from "../config/contract";

type Row = {
  tokenId: string;
  studentName: string;
  course: string;
  issueDate: string;
  institution: string;
  isRevoked: boolean;
};

type LoadState =
  | { phase: "loading" }
  | { phase: "empty" }
  | { phase: "error"; message: string }
  | { phase: "loaded"; rows: Row[] };

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function VerifyWallet() {
  const { address } = useParams();
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        setState({ phase: "error", message: "Invalid wallet address." });
        return;
      }
      if (!CONTRACT_ADDRESS) {
        setState({
          phase: "error",
          message:
            "Contract address is not configured yet. Set VITE_CONTRACT_ADDRESS.",
        });
        return;
      }

      setState({ phase: "loading" });
      try {
        const provider = getReadOnlyProvider();
        const contract = getContract(provider);

        const tokenIds: bigint[] = await contract.getCredentialsByStudent(
          address
        );

        if (tokenIds.length === 0) {
          if (!cancelled) setState({ phase: "empty" });
          return;
        }

        const rows = await Promise.all(
          tokenIds.map(async (id) => {
            const info = await contract.getCredential(id);
            const metadata = await fetchMetadata(info.metadataURI).catch(
              () => null
            );
            const attr = (trait: string) =>
              metadata?.attributes.find((a) => a.trait_type === trait)
                ?.value ?? "—";
            return {
              tokenId: id.toString(),
              studentName: metadata ? attr("Student") : "—",
              course: metadata ? attr("Course") : "—",
              issueDate: metadata ? attr("Issue Date") : "—",
              institution: metadata ? attr("Issuer") : "—",
              isRevoked: info.isRevoked,
            };
          })
        );

        if (!cancelled) setState({ phase: "loaded", rows });
      } catch (err: any) {
        if (!cancelled) {
          setState({
            phase: "error",
            message: err?.message || "Failed to load credentials.",
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-serif text-2xl">Credentials for wallet</h1>
      <p className="mt-1 font-mono text-sm text-ink-muted">
        {address ? shorten(address) : ""}
      </p>

      {state.phase === "loading" && (
        <p className="mt-8 text-ink-muted">Loading credentials...</p>
      )}

      {state.phase === "empty" && (
        <div className="mt-8">
          <p className="text-ink-muted">
            No certificates have been issued to this wallet yet.
          </p>
          <Link
            to="/verify"
            className="mt-4 inline-block text-sm text-seal-brass underline"
          >
            Try another lookup
          </Link>
        </div>
      )}

      {state.phase === "error" && (
        <div className="mt-8 border border-seal-revoked/40 bg-seal-revoked/10 px-4 py-3 text-sm text-seal-revoked">
          {state.message}
        </div>
      )}

      {state.phase === "loaded" && (
        <div className="mt-8 divide-y divide-white/10 border border-white/10">
          {state.rows.map((row) => (
            <Link
              key={row.tokenId}
              to={`/verify/${row.tokenId}`}
              className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div>
                <p className="font-serif text-base">{row.course}</p>
                <p className="text-sm text-ink-muted">
                  {row.institution} — {row.issueDate}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={row.isRevoked ? "revoked" : "valid"} />
                <span className="text-xs text-ink-muted">
                  #{row.tokenId}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
