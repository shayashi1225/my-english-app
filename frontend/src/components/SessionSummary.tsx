import { SessionSummary as SummaryData } from "../services/api";
import { useNavigate } from "react-router-dom";

interface Props {
  data: SummaryData;
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? "text-green-600" :
    score >= 60 ? "text-yellow-600" :
    "text-red-600";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-4xl font-bold ${color}`}>{Math.round(score)}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

export default function SessionSummaryView({ data }: Props) {
  const navigate = useNavigate();
  const { summary, vocabulary } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">セッション完了！</h2>
        <p className="text-gray-500">今回の結果レポート</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex justify-around mb-6">
          <ScoreCircle score={summary.total_score} label="総合" />
          <ScoreCircle score={summary.grammar_score} label="文法" />
          <ScoreCircle score={summary.fluency_score} label="流暢さ" />
        </div>
        <p className="text-gray-700 text-sm leading-relaxed">{summary.overall_summary}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {summary.strengths.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-5">
            <h3 className="font-semibold text-green-800 mb-3">良かった点</h3>
            <ul className="space-y-2">
              {summary.strengths.map((s, i) => (
                <li key={i} className="text-green-700 text-sm flex gap-2">
                  <span>✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.areas_for_improvement.length > 0 && (
          <div className="bg-yellow-50 rounded-2xl p-5">
            <h3 className="font-semibold text-yellow-800 mb-3">改善点</h3>
            <ul className="space-y-2">
              {summary.areas_for_improvement.map((a, i) => (
                <li key={i} className="text-yellow-700 text-sm flex gap-2">
                  <span>→</span>{a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {vocabulary.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">今回のセッションで覚えたい表現</h3>
          <div className="space-y-3">
            {vocabulary.map((v, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="font-semibold text-blue-700 mb-1">"{v.word_or_phrase}"</p>
                <p className="text-gray-600 text-sm mb-2">{v.explanation}</p>
                {v.example_sentence && (
                  <p className="text-gray-400 text-xs italic">例: {v.example_sentence}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 transition-colors"
        >
          もう一度練習する
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 font-semibold hover:bg-gray-200 transition-colors"
        >
          ダッシュボードを見る
        </button>
      </div>
    </div>
  );
}
