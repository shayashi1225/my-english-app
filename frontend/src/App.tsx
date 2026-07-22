import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Conversation from "./pages/Conversation";
import Dashboard from "./pages/Dashboard";
import Review from "./pages/Review";
import { api } from "./services/api";

function NavBar() {
  const location = useLocation();
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    api.getReviewQueue(1).then((q) => setDueCount(q.due_count)).catch(() => {});
  }, [location.pathname]);

  if (location.pathname.startsWith("/conversation")) return null;

  return (
    <nav className="border-b border-cyber-border bg-cyber-bg/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-mono font-bold text-lg neon-cyan tracking-widest">
          ◈ MY ENGLISH APP
        </Link>
        <div className="flex gap-8 text-xs font-mono uppercase tracking-widest">
          {[
            { to: "/", label: "Practice" },
            { to: "/review", label: "Review", badge: dueCount },
            { to: "/dashboard", label: "Dashboard" },
          ].map(({ to, label, badge }) => (
            <Link
              key={to}
              to={to}
              className={
                location.pathname === to
                  ? "text-cyber-cyan neon-cyan"
                  : "text-cyber-cyan/40 hover:text-cyber-cyan/80 transition-colors"
              }
            >
              {label}
              {!!badge && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-cyber-blue text-white text-[10px] font-mono align-middle normal-case tracking-normal">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/conversation/:sessionId" element={<Conversation />} />
            <Route path="/review" element={<Review />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
