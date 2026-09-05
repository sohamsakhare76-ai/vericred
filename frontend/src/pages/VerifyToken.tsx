import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CertificateCard } from "../components/CertificateCard";
import { getReadOnlyProvider } from "../lib/readOnlyProvider";
import { getContract } from "../lib/contract";
import { fetchMetadata, ipfsToGatewayUrl } from "../lib/ipfs";
import { BLOCK_EXPLORER_BASE, CONTRACT_ADDRESS } from "../config/contract";

type LoadState =
  | { phase: "loading" }
  | { phase: "not-found" }
  | { phase: "error"; message: string }
  | {
      phase: "loaded";
      studentName: string;
      course: string;
      issueDate: string;
      institution: string;
      studentAddress: string;
      issuerAddress: string;
      isRevoked: boolean;
      metadataURI: string;
    };

export function VerifyToken() {
  const { tokenId } = useParams();
  const [state, setState] = useState<LoadState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!tokenId || isNaN(Number(tokenId))) {
        setState({ phase: "not-found" });
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

        const info = await contract.getCredential(Number(tokenId));
        const metadata = await fetchMetadata(info.metadataURI).catch(
          () => null
        );

        const attr = (trait: string) =>
          metadata?.attributes.find((a) => a.trait_type === trait)?.value ??
          "—";

        if (cancelled) return;

        setState({
          phase: "loaded",
          studentName: metadata ? attr("Student") : "—",
          course: metadata ? attr("Course") : "—",
          issueDate: metadata ? attr("Issue Date") : "—",
          institution: metadata ? attr("Issuer") : "—",
          studentAddress: info.student,
          issuerAddress: info.issuer,
          isRevoked: info.isRevoked,
          metadataURI: info.metadataURI,
        });
      } catch (err: any) {
        if (cancelled) return;
        if (err?.message?.includes("InvalidToken") || err?.reason === "InvalidToken") {
          setState({ phase: "not-found" });
        } else {
          setState({
            phase: "error",
            message: err?.message || "Failed to load credential.",
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {state.phase === "loading" && (
        <p className="text-center text-ink-muted">Loading credential...</p>
      )}

      {state.phase === "not-found" && (
        <div className="text-center">
          <h1 className="font-serif text-2xl">No credential found</h1>
          <p className="mt-3 text-ink-muted">
            Token #{tokenId} does not exist on this contract.
          </p>
          <Link
            to="/verify"
            className="mt-6 inline-block text-sm text-seal-brass underline"
          >
            Try another token ID
          </Link>
        </div>
      )}

      {state.phase === "error" && (
        <div className="border border-seal-revoked/40 bg-seal-revoked/10 px-4 py-3 text-center text-sm text-seal-revoked">
          {state.message}
        </div>
      )}

      {state.phase === "loaded" && (
        <>
          <CertificateCard
            data={{
              tokenId: tokenId!,
              studentName: state.studentName,
              course: state.course,
              issueDate: state.issueDate,
              institution: state.institution,
              issuerAddress: state.issuerAddress,
              studentAddress: state.studentAddress,
              isRevoked: state.isRevoked,
              metadataURI: state.metadataURI,
            }}
          />
          <div className="mt-8 flex justify-center gap-6 text-sm">
            <a
              href={ipfsToGatewayUrl(state.metadataURI)}
              target="_blank"
              rel="noreferrer"
              className="text-seal-brass underline"
            >
              View IPFS metadata
            </a>
            <a
              href={`${BLOCK_EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-seal-brass underline"
            >
              View contract on Etherscan
            </a>
          </div>
        </>
      )}
    </div>
  );
}
