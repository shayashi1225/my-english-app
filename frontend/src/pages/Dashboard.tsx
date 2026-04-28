import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { api, DashboardData } from "../services/api";
import SessionDetailModal from "../components/SessionDetailModal";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Progress</h1>
        <p className="text-gray-500 text-sm mt-1">Track your English improvement over time</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Sessions" value={data.total_sessions} sub="completed" />
        <StatCard label="Average Score" value={`${data.average_score}`} sub="out of 100" />
        <StatCard label="Current Streak" value={`${data.current_streak} days`} />
        <StatCard
          label="Best Situation"
          value={
            data.situation_stats.length > 0
              ? data.situation_stats.sort((a, b) => b.avg_score - a.avg_score)[0].title.split(" ")[0]
              : "—"
          }
        />
      </div>

      {data.daily_scores.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Score Trend (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.daily_scores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [`${v}`, "Score"]}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Line
                type="monotone"
                dataKey="avg_score"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.situation_stats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Performance by Situation</h2>
          <div className="space-y-3">
            {data.situation_stats.map((s) => (
              <div key={s.title} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-52 truncate">{s.title}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{ width: `${s.avg_score}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-12 text-right">
                  {s.avg_score}
                </span>
                <span className="text-xs text-gray-400 w-16">×{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recent_sessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">過去のセッション</h2>
          <div className="divide-y divide-gray-100">
            {data.recent_sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className="w-full py-3 flex items-center justify-between hover:bg-gray-50 rounded-xl px-2 -mx-2 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{s.situation_title}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.started_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right text-sm">
                  <div>
                    <p className="font-semibold text-gray-900">{Math.round(s.total_score)}</p>
                    <p className="text-xs text-gray-400">総合</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">{Math.round(s.grammar_score)}</p>
                    <p className="text-xs text-gray-400">文法</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">{Math.round(s.fluency_score)}</p>
                    <p className="text-xs text-gray-400">流暢さ</p>
                  </div>
                  <span className="text-gray-300 text-base">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {data.total_sessions === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📊</p>
          <p className="font-medium">まだセッションがありません</p>
          <p className="text-sm mt-1">最初のセッションを完了するとここに表示されます</p>
        </div>
      )}

      {selectedSessionId !== null && (
        <SessionDetailModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}
