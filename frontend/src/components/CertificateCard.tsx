import { StatusBadge } from "./StatusBadge";
import { QRCard } from "./QRCard";

export type CertificateData = {
  tokenId: string;
  studentName: string;
  course: string;
  issueDate: string;
  institution: string;
  issuerAddress: string;
  studentAddress: string;
  isRevoked: boolean;
  metadataURI: string;
  txHash?: string;
};

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function CertificateCard({
  data,
  showQR = true,
}: {
  data: CertificateData;
  showQR?: boolean;
}) {
  return (
    <div className="unseal-reveal mx-auto max-w-xl">
      <div className="diploma-border bg-parchment px-10 py-12 text-center text-ink">
        <p className="font-serif text-xs uppercase tracking-[0.3em] text-seal-brass">
          VeriCred
        </p>
        <p className="mt-1 font-serif text-sm text-ink/70">
          Verified Credential
        </p>

        <h2 className="mt-8 font-serif text-3xl font-medium">
          {data.studentName}
        </h2>
        <p className="mt-3 font-serif text-lg italic text-ink/80">
          has completed
        </p>
        <p className="mt-1 font-serif text-xl font-medium">{data.course}</p>

        <p className="mt-6 text-sm text-ink/70">Issued {data.issueDate}</p>
        <p className="text-sm text-ink/70">{data.institution}</p>

        <div className="mt-8 flex justify-center">
          <StatusBadge status={data.isRevoked ? "revoked" : "valid"} />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 border-t border-ink/10 pt-6 text-left text-xs text-ink/60">
          <div>
            <p className="uppercase tracking-wide">Token ID</p>
            <p className="mt-1 font-mono text-ink">#{data.tokenId}</p>
          </div>
          <div>
            <p className="uppercase tracking-wide">Student wallet</p>
            <p className="mt-1 font-mono text-ink">
              {shorten(data.studentAddress)}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">Issuer wallet</p>
            <p className="mt-1 font-mono text-ink">
              {shorten(data.issuerAddress)}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide">Network</p>
            <p className="mt-1 text-ink">Sepolia</p>
          </div>
        </div>
      </div>

      {showQR && (
        <div className="mt-6 flex justify-center">
          <QRCard tokenId={data.tokenId} />
        </div>
      )}
    </div>
  );
}
