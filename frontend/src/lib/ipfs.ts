// Pinata IPFS helpers. The Pinata JWT is a write-scoped pinning credential,
// not a blockchain private key — but it is still a secret. For a hackathon
// demo it is acceptable to hold it in the frontend .env (VITE_ prefixed
// vars are bundled into the client build), but note in the README that a
// production build should proxy uploads through a minimal backend so the
// JWT is never shipped to the browser.

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";
const PINATA_GATEWAY =
  import.meta.env.VITE_PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs";

export type CredentialMetadata = {
  name: string;
  description: string;
  attributes: { trait_type: string; value: string }[];
};

export function buildCredentialMetadata(params: {
  studentName: string;
  course: string;
  issueDate: string;
  institution: string;
}): CredentialMetadata {
  return {
    name: `${params.studentName} - ${params.course} Certificate`,
    description: `Educational credential issued by ${params.institution}`,
    attributes: [
      { trait_type: "Student", value: params.studentName },
      { trait_type: "Course", value: params.course },
      { trait_type: "Issue Date", value: params.issueDate },
      { trait_type: "Issuer", value: params.institution },
    ],
  };
}

export async function uploadMetadataToIPFS(
  metadata: CredentialMetadata
): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error(
      "Pinata is not configured. Set VITE_PINATA_JWT in frontend/.env."
    );
  }

  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: { name: `vericred-${Date.now()}.json` },
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`IPFS upload failed: ${text}`);
  }

  const data = await response.json();
  const cid = data.IpfsHash as string;
  return `ipfs://${cid}`;
}

/** Converts an ipfs:// URI to an HTTP gateway URL for fetching in-browser. */
export function ipfsToGatewayUrl(ipfsUri: string): string {
  if (ipfsUri.startsWith("ipfs://")) {
    return `${PINATA_GATEWAY}/${ipfsUri.replace("ipfs://", "")}`;
  }
  return ipfsUri;
}

export async function fetchMetadata(
  ipfsUri: string
): Promise<CredentialMetadata> {
  const url = ipfsToGatewayUrl(ipfsUri);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch metadata from IPFS.");
  }
  return response.json();
}
