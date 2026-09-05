import { FormEvent, useState } from "react";

export type CertificateFormValues = {
  studentAddress: string;
  studentName: string;
  course: string;
  issueDate: string;
  institution: string;
};

export function CertificateForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: CertificateFormValues) => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<CertificateFormValues>({
    studentAddress: "",
    studentName: "",
    course: "",
    issueDate: new Date().toISOString().slice(0, 10),
    institution: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  function update<K extends keyof CertificateFormValues>(
    key: K,
    value: CertificateFormValues[K]
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!/^0x[a-fA-F0-9]{40}$/.test(values.studentAddress.trim())) {
      setValidationError("Enter a valid student wallet address (0x...).");
      return;
    }
    if (!values.studentName.trim() || !values.course.trim() || !values.institution.trim()) {
      setValidationError("Fill in all fields before issuing.");
      return;
    }

    onSubmit(values);
  }

  const inputClass =
    "w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-parchment placeholder:text-ink-muted focus:border-seal-brass";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-wide text-ink-muted">
          Student wallet address
        </label>
        <input
          className={inputClass}
          placeholder="0x..."
          value={values.studentAddress}
          onChange={(e) => update("studentAddress", e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-ink-muted">
            Student name
          </label>
          <input
            className={inputClass}
            placeholder="Alice Johnson"
            value={values.studentName}
            onChange={(e) => update("studentName", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-ink-muted">
            Course
          </label>
          <input
            className={inputClass}
            placeholder="Blockchain Development"
            value={values.course}
            onChange={(e) => update("course", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-ink-muted">
            Issue date
          </label>
          <input
            type="date"
            className={inputClass}
            value={values.issueDate}
            onChange={(e) => update("issueDate", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-ink-muted">
            Institution / issuer name
          </label>
          <input
            className={inputClass}
            placeholder="HackBlox University"
            value={values.institution}
            onChange={(e) => update("institution", e.target.value)}
          />
        </div>
      </div>

      {validationError && (
        <p className="text-sm text-seal-revoked">{validationError}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full border border-seal-brass py-3 text-sm text-seal-brass hover:bg-seal-brass hover:text-ink transition-colors disabled:opacity-50"
      >
        {submitting ? "Issuing..." : "Issue Certificate"}
      </button>
    </form>
  );
}
