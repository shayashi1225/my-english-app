import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, SessionSummary as SummaryData } from "../services/api";
import ShadowingPlayer from "./ShadowingPlayer";

interface Props {
  data: SummaryData;
  sessionId: number;
}

type Tab = "summary" | "shadowing";

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? "text-cyber-green" :
    score >= 60 ? "text-cyber-yellow" :
    "text-cyber-red";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-4xl font-bold font-mono ${color}`}>
        {Math.round(score)}
      </div>
      <div className="text-xs font-mono text-cyber-cyan/40 tracking-widest">{label}</div>
    </div>
  );
}

export default function SessionSummaryView({ data, sessionId }: Props) {
  const navigate = useNavigate();
  const { summary, vocabulary } = data;
  const [tab, setTab] = useState<Tab>("summary");
  const [shadowingItems, setShadowingItems] = useState<{ original: string; corrected: string }[]>([]);

  useEffect(() => {
    api.getSession(sessionId).then((detail) => {
      const items = detail.turns
        .filter((t) => t.speaker === "user" && t.corrected_text && t.corrected_text !== t.text)
        .map((t) => ({ original: t.text, corrected: t.corrected_text! }));
      setShadowingItems(items);
    });
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-cyber-blue mb-2 neon-blue">
          ▸ SESSION COMPLETE
        </p>
        <h2 className="text-2xl font-bold font-mono neon-cyan tracking-wider">RESULT REPORT</h2>
        <div className="h-px bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-30 mt-3" />
      </div>

      {/* Scores */}
      <div className="cyber-card">
        <div className="flex justify-around mb-6 py-2">
          <ScoreCircle score={summary.total_score} label="総合" />
          <div className="w-px bg-cyber-cyan/10" />
          <ScoreCircle score={summary.grammar_score} label="文法" />
          <div className="w-px bg-cyber-cyan/10" />
          <ScoreCircle score={summary.fluency_score} label="流暢さ" />
        </div>
        <div className="border-t border-cyber-border pt-4">
          <p className="text-cyber-cyan/70 text-sm font-mono leading-relaxed">{summary.overall_summary}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cyber-border">
        {([["summary", "結果レポート"], ["shadowing", `シャドーイング練習 ${shadowingItems.length > 0 ? `(${shadowingItems.length})` : ""}`]] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 px-5 text-xs font-mono tracking-widest border-b-2 -mb-px transition-all
              ${tab === t
                ? "border-cyber-cyan text-cyber-cyan neon-cyan"
                : "border-transparent text-cyber-cyan/30 hover:text-cyber-cyan/60"}`}
          >
            {t === tab ? "▸ " : ""}{label.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "summary" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary.strengths.length > 0 && (
              <div className="rounded-xl p-5 border border-cyber-green/30 bg-cyber-green/5">
                <h3 className="font-mono text-xs tracking-widest text-cyber-green mb-3 neon-green">
                  ◈ 良かった点
                </h3>
                <ul className="space-y-2">
                  {summary.strengths.map((s, i) => (
                    <li key={i} className="text-cyber-green/70 text-sm font-mono flex gap-2">
                      <span>✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.areas_for_improvement.length > 0 && (
              <div className="rounded-xl p-5 border border-cyber-yellow/30 bg-cyber-yellow/5">
                <h3 className="font-mono text-xs tracking-widest text-cyber-yellow mb-3">
                  ◈ 改善点
                </h3>
                <ul className="space-y-2">
                  {summary.areas_for_improvement.map((a, i) => (
                    <li key={i} className="text-cyber-yellow/70 text-sm font-mono flex gap-2">
                      <span>→</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {vocabulary.length > 0 && (
            <div>
              <h3 className="font-mono text-xs tracking-widest text-cyber-blue mb-4">
                ◈ 今回のセッションで覚えたい表現
              </h3>
              <div className="space-y-3">
                {vocabulary.map((v, i) => (
                  <div key={i} className="cyber-card">
                    <p className="font-mono font-semibold text-cyber-blue mb-1 text-sm">
                      "{v.word_or_phrase}"
                    </p>
                    <p className="text-cyber-cyan/60 text-sm mb-2">{v.explanation}</p>
                    {v.example_sentence && (
                      <p className="text-cyber-cyan/30 text-xs font-mono italic border-l-2 border-cyber-cyan/20 pl-3">
                        例: {v.example_sentence}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <ShadowingPlayer items={shadowingItems} sessionId={sessionId} />
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => navigate("/")}
          className="cyber-btn flex-1 py-3"
        >
          ▸ もう一度練習する
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="cyber-btn-blue flex-1 py-3"
        >
          ▸ ダッシュボード
        </button>
      </div>
    </div>
  );
}
