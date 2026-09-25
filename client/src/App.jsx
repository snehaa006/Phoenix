import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { AuthContext } from "../context/AuthContext.jsx";
import assets from "./assets/assets";

const App = () => {
  const { authUser, authLoading } = useContext(AuthContext);

  return (
    <div className="relative min-h-dvh bg-[url('/bgImage8.jpg')] bg-cover bg-center bg-fixed">
      {/* darken the wallpaper so panels stay readable */}
      <div className="fixed inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/60 to-ink-950/85" />
      <div className="relative">
        <Toaster position="top-center" toastOptions={{
          style: { background: "#131b36", color: "#e2e8f0", border: "1px solid rgb(255 255 255 / 0.1)", borderRadius: "14px", fontSize: "14px" },
        }} />
        {authLoading ? (
          //wait for the saved session check so refreshing never flashes the login page
          <div className="h-dvh flex flex-col items-center justify-center gap-4">
            <img src={assets.logo} alt="" className="w-16 h-16 animate-pulse" />
            <p className="text-sm text-slate-400">Loading Phoenix…</p>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" replace />} />
            <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" replace />} />
            <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </div>
  );
};

export default App;
