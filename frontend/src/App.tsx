import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Conversation from "./pages/Conversation";
import Dashboard from "./pages/Dashboard";

function NavBar() {
  const location = useLocation();
  const isConversation = location.pathname.startsWith("/conversation");

  if (isConversation) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-xl text-blue-600">
          My English App
        </Link>
        <div className="flex gap-6 text-sm font-medium">
          <Link
            to="/"
            className={`${location.pathname === "/" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
          >
            Practice
          </Link>
          <Link
            to="/dashboard"
            className={`${location.pathname === "/dashboard" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
          >
            Dashboard
          </Link>
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
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
