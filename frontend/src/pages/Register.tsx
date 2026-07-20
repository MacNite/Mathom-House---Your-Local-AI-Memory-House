import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

export default function Register() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) return setError("Passwords do not match.");
    setSaving(true);
    setError("");
    try {
      await api.acceptInvitation(params.get("token") || "", password);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="font-display text-3xl text-ink-900">
        Set your Mathom password
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Your email address and username were set by the administrator.
      </p>
      <form onSubmit={submit} className="card mt-6 space-y-4">
        <label className="block text-sm text-ink-700">
          Password
          <input
            required
            minLength={12}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input mt-1"
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm text-ink-700">
          Confirm password
          <input
            required
            minLength={12}
            type="password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="input mt-1"
            autoComplete="new-password"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={saving || !params.get("token")}
          className="btn-primary disabled:opacity-60"
        >
          {saving ? "Creating account…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
