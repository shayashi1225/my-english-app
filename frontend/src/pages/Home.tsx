import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Situation } from "../services/api";
import { SituationIcon } from "../components/Icons";

export default function Home() {
  const [situations, setSituations] = useState<Situation[]>([]);
  const [starting, setStarting] = useState<string | null>(null);
  const [learnerName, setLearnerName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSituations().then(setSituations);
    const saved = localStorage.getItem("learner_name") || "";
    setLearnerName(saved);
  }, []);

  function handleSaveName(name: string) {
    localStorage.setItem("learner_name", name);
    setLearnerName(name);
    setEditingName(false);
  }

  async function handleSelect(situation: Situation) {
    if (!learnerName.trim()) {
      alert("Please enter your name first");
      setEditingName(true);
      return;
    }
    setStarting(situation.id);
    try {
      const res = await api.startSession(situation.id, learnerName);
      navigate(`/conversation/${res.session_id}`, {
        state: { aiMessage: res.ai_message, situation: res.situation },
      });
    } finally {
      setStarting(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Name Section */}
      <div className="mb-12 cyber-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-widest text-cyber-blue mb-2">◈ LEARNER NAME</p>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  defaultValue={learnerName}
                  placeholder="Enter your name"
                  autoFocus
                  className="px-3 py-2 bg-cyber-bg border border-cyber-cyan text-cyber-cyan font-mono text-sm rounded"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveName(e.currentTarget.value);
                    } else if (e.key === "Escape") {
                      setEditingName(false);
                    }
                  }}
                  onBlur={(e) => handleSaveName(e.currentTarget.value)}
                />
              </div>
            ) : (
              <p className="font-mono text-lg text-cyber-cyan neon-cyan">{learnerName || "Not set"}</p>
            )}
          </div>
          <button
            onClick={() => setEditingName(!editingName)}
            className="cyber-btn-blue px-4 py-2 text-sm"
          >
            {editingName ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs tracking-[0.3em] text-cyber-blue mb-3 neon-blue">
          ▸ IT BUSINESS ENGLISH TRAINING SYSTEM
        </p>
        <h1 className="text-4xl font-bold font-mono neon-cyan mb-4 tracking-wider">
          SELECT SCENARIO
        </h1>
        <div className="h-px bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-40 mb-4" />
        <p className="text-cyber-cyan/60 text-sm">
          AIとのリアルな英会話でビジネス英語を鍛える
        </p>
      </div>

      {/* Situation grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {situations.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s)}
            disabled={starting !== null}
            className="cyber-card text-left group transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-9 h-9 mb-3 text-cyber-cyan"><SituationIcon id={s.id} /></div>
            <h2 className="font-mono font-semibold text-cyber-cyan text-sm tracking-wide mb-2 group-hover:neon-cyan">
              {s.title}
            </h2>
            <p className="text-cyber-cyan/50 text-xs leading-relaxed">{s.description}</p>
            {starting === s.id && (
              <p className="mt-3 text-cyber-blue text-xs font-mono animate-pulse">
                ▸ INITIALIZING...
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Footer info */}
      <div className="mt-12 border border-cyber-border rounded-xl p-5 text-center bg-cyber-bg3">
        <p className="font-mono text-xs tracking-widest text-cyber-blue">
          ◈ ONE SESSION / DAY &nbsp;|&nbsp; 5–10 MIN &nbsp;|&nbsp; VOICE-BASED &nbsp;|&nbsp; CHROME REQUIRED
        </p>
      </div>
    </div>
  );
}
