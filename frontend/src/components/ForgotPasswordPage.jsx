import React, { useState } from "react";
import axios from "axios";
import { API_URL } from '../config';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: normalizedEmail });
      setStatus("If your email is registered, a reset link has been sent.");
    } catch (err) {
      setStatus(err?.response?.data?.error || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 glass rounded-2xl shadow-card border border-white/20 backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-4 gradient-text">Forgot Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition duration-300"
            placeholder="you@example.com"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold py-3 px-4 rounded-full transition-all duration-300 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
      {status && <div className="mt-4 text-center text-primary-500 font-semibold">{status}</div>}
    </div>
  );
}
