import { useEffect, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { IssuerStatus } from "../components/IssuerStatus";
import { CertificateForm, CertificateFormValues } from "../components/CertificateForm";
import { TransactionStatus, TxState } from "../components/TransactionStatus";
import { NetworkGuard } from "../components/NetworkGuard";
import { CertificateCard } from "../components/CertificateCard";
import { getContract } from "../lib/contract";
import { buildCredentialMetadata, uploadMetadataToIPFS } from "../lib/ipfs";

export function Issue() {
  const { address, isCorrectNetwork, connect, getSigner } = useWallet();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [txState, setTxState] = useState<TxState>({ phase: "idle" });
  const [issuedCert, setIssuedCert] = useState<
    | (CertificateFormValues & { tokenId: string; issuerAddress: string; txHash: string })
    | null
  >(null);

  useEffect(() => {
    async function checkAuthorization() {
      if (!address || !isCorrectNetwork) {
        setIsAuthorized(null);
        return;
      }
      setCheckingAuth(true);
      try {
        const signer = await getSigner();
        const contract = getContract(signer);
        const authorized: boolean = await contract.authorizedIssuers(address);
        setIsAuthorized(authorized);
      } catch (err) {
        setIsAuthorized(null);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuthorization();
  }, [address, isCorrectNetwork, getSigner]);

  async function handleIssue(values: CertificateFormValues) {
    setTxState({ phase: "uploading" });
    try {
      const metadata = buildCredentialMetadata({
        studentName: values.studentName,
        course: values.course,
        issueDate: values.issueDate,
        institution: values.institution,
      });
      const metadataURI = await uploadMetadataToIPFS(metadata);

      setTxState({ phase: "confirming" });
      const signer = await getSigner();
      const contract = getContract(signer);

      const tx = await contract.issueCredential(
        values.studentAddress,
        metadataURI
      );
      setTxState({ phase: "pending", hash: tx.hash });

      const receipt = await tx.wait();

      const issuedEvent = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed: any) => parsed?.name === "CredentialIssued");

      const tokenId = issuedEvent
        ? issuedEvent.args.tokenId.toString()
        : "?";

      setTxState({ phase: "success", hash: tx.hash, tokenId });
      setIssuedCert({
        ...values,
        tokenId,
        issuerAddress: address ?? "",
        txHash: tx.hash,
      });
    } catch (err: any) {
      const message =
        err?.code === "ACTION_REJECTED"
          ? "Transaction rejected in MetaMask."
          : err?.message || "Something went wrong issuing the credential.";
      setTxState({ phase: "error", message });
    }
  }

  if (!address) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl">Issuer Dashboard</h1>
        <p className="mt-4 text-ink-muted">
          Connect your wallet to check issuer status and create certificates.
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
        <h1 className="font-serif text-3xl">Issuer Dashboard</h1>
        <div className="mt-8">
          <IssuerStatus
            address={address}
            isAuthorized={isAuthorized}
            loading={checkingAuth}
          />
        </div>

        {isAuthorized === false && (
          <p className="mt-6 border border-seal-revoked/40 bg-seal-revoked/10 px-4 py-3 text-sm text-seal-revoked">
            This wallet is not an authorized issuer. Ask the contract owner
            to add it from the Admin page.
          </p>
        )}

        {isAuthorized && !issuedCert && (
          <div className="mt-10">
            <CertificateForm
              onSubmit={handleIssue}
              submitting={
                txState.phase !== "idle" &&
                txState.phase !== "error" &&
                txState.phase !== "success"
              }
            />
            <div className="mt-4">
              <TransactionStatus state={txState} />
            </div>
          </div>
        )}

        {issuedCert && (
          <div className="mt-12">
            <CertificateCard
              data={{
                tokenId: issuedCert.tokenId,
                studentName: issuedCert.studentName,
                course: issuedCert.course,
                issueDate: issuedCert.issueDate,
                institution: issuedCert.institution,
                issuerAddress: issuedCert.issuerAddress,
                studentAddress: issuedCert.studentAddress,
                isRevoked: false,
                metadataURI: "",
              }}
            />
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setIssuedCert(null);
                  setTxState({ phase: "idle" });
                }}
                className="border border-white/20 px-6 py-2 text-sm text-parchment hover:border-white/40 transition-colors"
              >
                Issue another certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </NetworkGuard>
  );
}
