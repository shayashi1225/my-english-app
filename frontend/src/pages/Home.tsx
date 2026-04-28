import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Situation } from "../services/api";

export default function Home() {
  const [situations, setSituations] = useState<Situation[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getSituations().then(setSituations);
  }, []);

  async function handleSelect(situation: Situation) {
    setStarting(situation.id);
    setLoading(true);
    try {
      const res = await api.startSession(situation.id);
      navigate(`/conversation/${res.session_id}`, {
        state: { aiMessage: res.ai_message, situation: res.situation },
      });
    } finally {
      setLoading(false);
      setStarting(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Business English Practice
        </h1>
        <p className="text-gray-500 text-lg">
          Choose a scenario and practice your IT business English with AI
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {situations.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s)}
            disabled={loading}
            className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="text-4xl mb-3">{s.icon}</div>
            <h2 className="font-semibold text-gray-900 text-lg mb-1">{s.title}</h2>
            <p className="text-gray-500 text-sm">{s.description}</p>
            {starting === s.id && (
              <div className="mt-3 text-blue-500 text-sm font-medium animate-pulse">
                Starting session...
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 rounded-2xl p-6 text-center">
        <p className="text-blue-700 font-medium">
          One session per day · 5-10 minutes · Voice-based practice
        </p>
        <p className="text-blue-500 text-sm mt-1">
          Speak naturally — AI will evaluate your grammar and pronunciation in real time
        </p>
      </div>
    </div>
  );
}
