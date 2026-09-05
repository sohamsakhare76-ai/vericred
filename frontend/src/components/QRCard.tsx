import { QRCodeSVG } from "qrcode.react";

export function QRCard({ tokenId }: { tokenId: string }) {
  const verifyUrl = `${window.location.origin}/verify/${tokenId}`;

  return (
    <div className="flex flex-col items-center gap-3 border border-white/10 px-6 py-5">
      <QRCodeSVG value={verifyUrl} size={140} fgColor="#F6F0E4" bgColor="transparent" />
      <p className="text-center text-xs text-ink-muted break-all max-w-[220px]">
        {verifyUrl}
      </p>
      <a
        href={verifyUrl}
        className="text-xs text-seal-brass underline"
      >
        Open verification page
      </a>
    </div>
  );
}
