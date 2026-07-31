import { useEffect, useState } from "react";
import { api, SessionDetail } from "../services/api";
import ShadowingPlayer from "./ShadowingPlayer";

interface Props {
  sessionId: number;
  onClose: () => void;
}

function Score({ value, label }: { value: number | null; label: string }) {
  if (value == null) return null;
  const color =
    value >= 80 ? "text-cyber-green" :
    value >= 60 ? "text-cyber-yellow" :
    "text-cyber-red";
  return (
    <div className="flex flex-col items-center">
      <span className={`text-3xl font-bold font-mono ${color}`}>
        {Math.round(value)}
      </span>
      <span className="text-xs font-mono text-cyber-cyan/40 mt-0.5 tracking-widest">{label}</span>
    </div>
  );
}

export default function SessionDetailModal({ sessionId, onClose }: Props) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"summary" | "conversation" | "shadowing">("summary");

  useEffect(() => {
    api.getSession(sessionId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(22,22,22,0.5)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border-[1.5px] border-cyber-cyan bg-white"
           style={{ boxShadow: "4px 4px 0 rgba(22,22,22,0.9)" }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-cyber-border flex items-start justify-between bg-white">
          <div>
            <p className="font-mono text-xs tracking-widest text-cyber-blue mb-1">◈ SESSION DETAIL</p>
            <p className="font-bold font-mono text-cyber-cyan text-base">
              {detail?.situation_title ?? "セッション詳細"}
            </p>
            {detail?.started_at && (
              <p className="text-xs font-mono text-cyber-cyan/30 mt-0.5">
                {new Date(detail.started_at).toLocaleString("ja-JP")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-cyber-cyan/30 hover:text-cyber-red transition-colors font-mono text-xl ml-4"
          >✕</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
          </div>
        ) : !detail ? (
          <div className="flex-1 flex items-center justify-center font-mono text-cyber-cyan/30 py-16 text-sm">
            ⚠ データを取得できませんでした
          </div>
        ) : (
          <>
            {/* Scores */}
            {detail.total_score != null && (
              <div className="px-6 py-5 flex justify-around border-b border-cyber-border">
                <Score value={detail.total_score} label="総合" />
                <Score value={detail.grammar_score} label="文法" />
                <Score value={detail.fluency_score} label="流暢さ" />
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-cyber-border px-6">
              {([
                ["summary", "サマリー"],
                ["conversation", "会話ログ"],
                ["shadowing", "シャドーイング"],
              ] as const).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`py-3 px-4 text-xs font-mono tracking-widest border-b-2 transition-all -mb-px
                    ${tab === t
                      ? "border-cyber-cyan text-cyber-cyan neon-cyan"
                      : "border-transparent text-cyber-cyan/30 hover:text-cyber-cyan/60"}`}
                >
                  {label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {tab === "shadowing" ? (
                <ShadowingPlayer
                  items={detail.turns
                    .filter((t) => t.speaker === "user" && t.corrected_text && t.corrected_text !== t.text)
                    .map((t) => ({ original: t.text, corrected: t.corrected_text! }))}
                  sessionId={sessionId}
                />
              ) : tab === "summary" ? (
                <>
                  {detail.summary && (
                    <div className="rounded-lg border border-cyber-border px-4 py-4 text-sm font-mono text-cyber-cyan/70 leading-relaxed bg-cyber-bg3">
                      {detail.summary}
                    </div>
                  )}

                  {detail.vocabulary.length > 0 && (
                    <div>
                      <h3 className="font-mono text-xs tracking-widest text-cyber-blue mb-3">
                        ◈ 今回覚えたい表現
                      </h3>
                      <div className="space-y-3">
                        {detail.vocabulary.map((v, i) => (
                          <div key={i} className="rounded-lg border border-cyber-border px-4 py-3 bg-cyber-bg3">
                            <p className="font-mono font-semibold text-cyber-blue text-sm mb-1">
                              "{v.word_or_phrase}"
                            </p>
                            <p className="text-cyber-cyan/60 text-sm mb-1">{v.explanation}</p>
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

                  {!detail.summary && detail.vocabulary.length === 0 && (
                    <p className="font-mono text-cyber-cyan/30 text-xs text-center py-8 tracking-widest">
                      このセッションはまだ完了していません
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  {detail.turns.map((turn, i) => (
                    <div key={i} className={`flex ${turn.speaker === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-sm space-y-1">
                        <div
                          className={`px-4 py-3 rounded-lg text-sm font-mono leading-relaxed border
                            ${turn.speaker === "ai"
                              ? "border-cyber-border text-cyber-cyan bg-cyber-bg3"
                              : "border-cyber-blue text-cyber-cyan bg-cyber-blue/8"}`}
                        >
                          {turn.text}
                        </div>
                        {turn.speaker === "user" && turn.grammar_feedback && (
                          <div className="text-xs font-mono text-cyber-cyan/40 px-2 space-y-0.5">
                            {turn.grammar_score != null && (
                              <span className="text-cyber-blue">文法スコア: {turn.grammar_score}/10　</span>
                            )}
                            {turn.corrected_text && turn.corrected_text !== turn.text && (
                              <p className="text-cyber-cyan/50">修正: "{turn.corrected_text}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
