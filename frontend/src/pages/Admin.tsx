import { FormEvent, useEffect, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { NetworkGuard } from "../components/NetworkGuard";
import { getContract } from "../lib/contract";
import { StatusBadge } from "../components/StatusBadge";

type IssuerRow = { address: string; authorized: boolean };

export function Admin() {
  const { address, isCorrectNetwork, connect, getSigner } = useWallet();
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [issuerInput, setIssuerInput] = useState("");
  const [revokeTokenId, setRevokeTokenId] = useState("");
  const [rows, setRows] = useState<IssuerRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function checkOwner() {
      if (!address || !isCorrectNetwork) {
        setIsOwner(null);
        return;
      }
      try {
        const signer = await getSigner();
        const contract = getContract(signer);
        const owner: string = await contract.owner();
        setIsOwner(owner.toLowerCase() === address.toLowerCase());
      } catch {
        setIsOwner(null);
      }
    }
    checkOwner();
  }, [address, isCorrectNetwork, getSigner]);

  async function refreshIssuerStatus(addr: string) {
    const signer = await getSigner();
    const contract = getContract(signer);
    const authorized: boolean = await contract.authorizedIssuers(addr);
    setRows((prev) => {
      const others = prev.filter(
        (r) => r.address.toLowerCase() !== addr.toLowerCase()
      );
      return [...others, { address: addr, authorized }];
    });
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!/^0x[a-fA-F0-9]{40}$/.test(issuerInput.trim())) {
      setMessage("Enter a valid address.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const signer = await getSigner();
      const contract = getContract(signer);
      const tx = await contract.addIssuer(issuerInput.trim());
      await tx.wait();
      setMessage(`Issuer ${issuerInput.trim()} authorized.`);
      await refreshIssuerStatus(issuerInput.trim());
      setIssuerInput("");
    } catch (err: any) {
      setMessage(err?.message || "Failed to add issuer.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(addr: string) {
    setBusy(true);
    setMessage(null);
    try {
      const signer = await getSigner();
      const contract = getContract(signer);
      const tx = await contract.removeIssuer(addr);
      await tx.wait();
      setMessage(`Issuer ${addr} removed.`);
      await refreshIssuerStatus(addr);
    } catch (err: any) {
      setMessage(err?.message || "Failed to remove issuer.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(e: FormEvent) {
    e.preventDefault();
    if (revokeTokenId.trim() === "" || isNaN(Number(revokeTokenId))) {
      setMessage("Enter a valid token ID.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const signer = await getSigner();
      const contract = getContract(signer);
      const tx = await contract.revokeCredential(Number(revokeTokenId));
      await tx.wait();
      setMessage(`Token #${revokeTokenId} revoked.`);
      setRevokeTokenId("");
    } catch (err: any) {
      setMessage(err?.message || "Failed to revoke credential.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "flex-1 border border-white/15 bg-transparent px-4 py-3 text-sm text-parchment placeholder:text-ink-muted focus:border-seal-brass";

  if (!address) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl">Admin</h1>
        <p className="mt-4 text-ink-muted">
          Connect the university/admin wallet to manage issuers.
        </p>
        <button
          onClick={connect}
          className="mt-8 border border-seal-brass px-6 py-3 text-sm text-seal-brass hover:bg-seal-brass hover:text-ink transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <NetworkGuard>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-serif text-3xl">Admin</h1>

        {isOwner === false && (
          <p className="mt-6 border border-seal-revoked/40 bg-seal-revoked/10 px-4 py-3 text-sm text-seal-revoked">
            Connected wallet is not the contract owner.
          </p>
        )}

        {isOwner && (
          <>
            <section className="mt-10">
              <h2 className="font-serif text-xl">Manage issuers</h2>
              <form onSubmit={handleAdd} className="mt-4 flex gap-3">
                <input
                  className={inputClass}
                  placeholder="0x... issuer address"
                  value={issuerInput}
                  onChange={(e) => setIssuerInput(e.target.value)}
                />
                <button
                  disabled={busy}
                  className="border border-seal-brass px-5 py-3 text-sm text-seal-brass hover:bg-seal-brass hover:text-ink transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </form>

              {rows.length > 0 && (
                <div className="mt-6 divide-y divide-white/10 border border-white/10">
                  {rows.map((row) => (
                    <div
                      key={row.address}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <span className="font-mono text-sm">{row.address}</span>
                      <div className="flex items-center gap-3">
                        <StatusBadge
                          status={row.authorized ? "authorized" : "unauthorized"}
                        />
                        {row.authorized && (
                          <button
                            onClick={() => handleRemove(row.address)}
                            disabled={busy}
                            className="text-xs text-seal-revoked underline disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-14">
              <h2 className="font-serif text-xl">Revoke a credential</h2>
              <form onSubmit={handleRevoke} className="mt-4 flex gap-3">
                <input
                  className={inputClass}
                  placeholder="Token ID"
                  value={revokeTokenId}
                  onChange={(e) => setRevokeTokenId(e.target.value)}
                  inputMode="numeric"
                />
                <button
                  disabled={busy}
                  className="border border-seal-revoked px-5 py-3 text-sm text-seal-revoked hover:bg-seal-revoked hover:text-white transition-colors disabled:opacity-50"
                >
                  Revoke
                </button>
              </form>
            </section>

            {message && (
              <p className="mt-8 border border-white/15 px-4 py-3 text-sm text-ink-muted">
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </NetworkGuard>
  );
}
