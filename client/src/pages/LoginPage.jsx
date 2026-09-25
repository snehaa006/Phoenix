import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext.jsx";
import { CheckCheckIcon, EyeIcon, EyeOffIcon, ImageIcon, Spinner, ChatIcon } from "../components/Icons";

const FEATURES = [
  { icon: ChatIcon, title: "Real-time messaging", text: "Messages arrive instantly, with typing indicators." },
  { icon: CheckCheckIcon, title: "Read receipts", text: "Know when your message has been seen." },
  { icon: ImageIcon, title: "Share photos", text: "Send images — or just paste a screenshot." },
];

const LoginPage = () => {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ fullName: "", email: "", password: "", bio: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useContext(AuthContext);

  const isSignup = mode === "signup";
  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const payload = isSignup ? form : { email: form.email, password: form.password };
    await login(mode, payload);
    setSubmitting(false); //on success this page unmounts via the route redirect
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-4 sm:p-8">
      <div className="panel w-full max-w-5xl grid overflow-hidden rounded-3xl md:grid-cols-2">
        {/* brand side */}
        <div className="relative hidden md:flex flex-col justify-between gap-10 p-10 bg-gradient-to-br from-brand-600/30 via-ink-800/60 to-ink-900/60">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <img src={assets.logo} alt="" className="w-11 h-11" />
            <span className="text-2xl font-semibold tracking-wide">Phoenix</span>
          </div>
          <div className="relative">
            <h1 className="text-4xl font-semibold leading-tight">
              Conversations that <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">feel instant.</span>
            </h1>
            <ul className="mt-8 space-y-5">
              {FEATURES.map(({ icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-300">{React.createElement(icon, { className: "w-5 h-5" })}</span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-slate-400">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} Phoenix</p>
        </div>

        {/* form side */}
        <div className="p-6 sm:p-10">
          <div className="md:hidden mb-8 flex items-center justify-center gap-3">
            <img src={assets.logo} alt="" className="w-10 h-10" />
            <span className="text-2xl font-semibold tracking-wide">Phoenix</span>
          </div>

          <h2 className="text-2xl font-semibold">{isSignup ? "Create your account" : "Welcome back"}</h2>
          <p className="mt-1 text-sm text-slate-400">{isSignup ? "It only takes a minute." : "Log in to continue your conversations."}</p>

          {/* mode switch */}
          <div className="mt-6 grid grid-cols-2 rounded-xl bg-white/5 p-1 text-sm ring-1 ring-white/10">
            {[["login", "Log in"], ["signup", "Sign up"]].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setMode(value)}
                className={`rounded-lg py-2 font-medium transition cursor-pointer ${mode === value ? "bg-brand-500 text-white shadow" : "text-slate-400 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {isSignup && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Full name</span>
                <input value={form.fullName} onChange={update("fullName")} type="text" autoComplete="name" maxLength={50}
                  placeholder="Jane Doe" required className="field" />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">Email</span>
              <input value={form.email} onChange={update("email")} type="email" autoComplete="email"
                placeholder="you@example.com" required className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">Password</span>
              <div className="relative">
                <input value={form.password} onChange={update("password")} type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 6 : undefined}
                  placeholder={isSignup ? "At least 6 characters" : "Your password"} required className="field pr-11" />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 icon-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </label>
            {isSignup && (
              <>
                <label className="block">
                  <span className="mb-1.5 flex justify-between text-xs font-medium text-slate-400">
                    Bio <span className="font-normal text-slate-500">optional · {form.bio.length}/160</span>
                  </span>
                  <textarea value={form.bio} onChange={update("bio")} rows={2} maxLength={160}
                    placeholder="A line or two about you" className="field resize-none" />
                </label>
                <label className="flex items-start gap-2.5 text-sm text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required
                    className="mt-0.5 h-4 w-4 accent-brand-500" />
                  I agree to the terms of use & privacy policy.
                </label>
              </>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting && <Spinner className="w-4 h-4" />}
              {isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {isSignup ? "Already have an account? " : "New to Phoenix? "}
            <button type="button" onClick={() => setMode(isSignup ? "login" : "signup")} className="font-medium text-brand-300 hover:underline cursor-pointer">
              {isSignup ? "Log in" : "Create an account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
