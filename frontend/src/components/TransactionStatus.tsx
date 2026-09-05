import { BLOCK_EXPLORER_BASE } from "../config/contract";

export type TxState =
  | { phase: "idle" }
  | { phase: "uploading" }
  | { phase: "confirming"; hash?: string }
  | { phase: "pending"; hash: string }
  | { phase: "success"; hash: string; tokenId: string }
  | { phase: "error"; message: string };

export function TransactionStatus({ state }: { state: TxState }) {
  if (state.phase === "idle") return null;

  if (state.phase === "uploading") {
    return (
      <p className="text-sm text-ink-muted">Uploading metadata to IPFS...</p>
    );
  }

  if (state.phase === "confirming") {
    return (
      <p className="text-sm text-ink-muted">
        Confirm the transaction in MetaMask...
      </p>
    );
  }

  if (state.phase === "pending") {
    return (
      <p className="text-sm text-seal-brass">
        Transaction pending —{" "}
        <a
          href={`${BLOCK_EXPLORER_BASE}/tx/${state.hash}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          view on Etherscan
        </a>
      </p>
    );
  }

  if (state.phase === "error") {
    return (
      <p className="border border-seal-revoked/40 bg-seal-revoked/10 px-4 py-3 text-sm text-seal-revoked">
        {state.message}
      </p>
    );
  }

  // success
  return (
    <div className="space-y-2 border border-seal-valid/40 bg-seal-valid/10 px-4 py-3 text-sm">
      <p className="text-seal-valid">Credential issued successfully.</p>
      <p className="text-ink-muted">Token ID: #{state.tokenId}</p>
      <a
        href={`${BLOCK_EXPLORER_BASE}/tx/${state.hash}`}
        target="_blank"
        rel="noreferrer"
        className="block underline text-ink-muted"
      >
        View transaction on Etherscan
      </a>
    </div>
  );
}
