import React, { useState } from "react";
import axios from "axios";
import { API_URL } from '../config';

export default function ResetPasswordPage() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, password });
      setStatus("Password reset successful. You can now log in.");
    } catch (err) {
      setStatus(err?.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <div className="max-w-md mx-auto mt-16 p-8 glass rounded-2xl shadow-card border border-white/20 backdrop-blur-sm text-center text-red-500 font-bold">Invalid or missing reset token.</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 glass rounded-2xl shadow-card border border-white/20 backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-4 gradient-text">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition duration-300"
            placeholder="Enter new password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold py-3 px-4 rounded-full transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      {status && <div className="mt-4 text-center text-primary-500 font-semibold">{status}</div>}
    </div>
  );
}
