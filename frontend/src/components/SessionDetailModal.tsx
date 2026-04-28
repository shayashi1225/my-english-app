import { useEffect, useState } from "react";
import { api, SessionDetail } from "../services/api";

interface Props {
  sessionId: number;
  onClose: () => void;
}

function Score({ value, label }: { value: number | null; label: string }) {
  if (value == null) return null;
  const color =
    value >= 80 ? "text-green-600" :
    value >= 60 ? "text-yellow-600" :
    "text-red-600";
  return (
    <div className="flex flex-col items-center">
      <span className={`text-3xl font-bold ${color}`}>{Math.round(value)}</span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  );
}

export default function SessionDetailModal({ sessionId, onClose }: Props) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"summary" | "conversation">("summary");

  useEffect(() => {
    api.getSession(sessionId)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {detail?.situation_title ?? "セッション詳細"}
            </p>
            {detail?.started_at && (
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(detail.started_at).toLocaleString("ja-JP")}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-4">✕</button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : !detail ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 py-16">
            データを取得できませんでした
          </div>
        ) : (
          <>
            {/* Scores */}
            {detail.total_score != null && (
              <div className="px-6 py-4 flex justify-around border-b border-gray-100">
                <Score value={detail.total_score} label="総合" />
                <Score value={detail.grammar_score} label="文法" />
                <Score value={detail.fluency_score} label="流暢さ" />
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              {(["summary", "conversation"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px
                    ${tab === t
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {t === "summary" ? "サマリー" : "会話ログ"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {tab === "summary" ? (
                <>
                  {detail.summary && (
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                      {detail.summary}
                    </div>
                  )}

                  {detail.vocabulary.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 text-sm">
                        今回覚えたい表現
                      </h3>
                      <div className="space-y-3">
                        {detail.vocabulary.map((v, i) => (
                          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="font-semibold text-blue-700 text-sm mb-1">
                              "{v.word_or_phrase}"
                            </p>
                            <p className="text-gray-600 text-sm mb-1">{v.explanation}</p>
                            {v.example_sentence && (
                              <p className="text-gray-400 text-xs italic">
                                例: {v.example_sentence}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!detail.summary && detail.vocabulary.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-8">
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
                          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                            ${turn.speaker === "ai"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-blue-600 text-white"}`}
                        >
                          {turn.text}
                        </div>
                        {turn.speaker === "user" && turn.grammar_feedback && (
                          <div className="text-xs text-gray-500 px-2 space-y-0.5">
                            {turn.grammar_score != null && (
                              <span className="font-medium">文法スコア: {turn.grammar_score}/10　</span>
                            )}
                            {turn.corrected_text && turn.corrected_text !== turn.text && (
                              <p className="text-blue-600">修正: "{turn.corrected_text}"</p>
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
