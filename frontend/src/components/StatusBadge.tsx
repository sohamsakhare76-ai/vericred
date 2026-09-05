type Props = {
  status: "valid" | "revoked" | "unauthorized" | "authorized";
};

const config = {
  valid: { label: "Valid", color: "border-seal-valid text-seal-valid" },
  revoked: { label: "Revoked", color: "border-seal-revoked text-seal-revoked" },
  authorized: {
    label: "Authorized",
    color: "border-seal-valid text-seal-valid",
  },
  unauthorized: {
    label: "Not authorized",
    color: "border-seal-revoked text-seal-revoked",
  },
};

export function StatusBadge({ status }: Props) {
  const { label, color } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-2 border px-3 py-1 text-sm ${color}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
