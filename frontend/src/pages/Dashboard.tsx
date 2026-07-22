import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { api, DashboardData } from "../services/api";
import SessionDetailModal from "../components/SessionDetailModal";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="cyber-card">
      <p className="text-cyber-blue font-mono text-xs tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-bold font-mono text-cyber-cyan neon-cyan">{value}</p>
      {sub && <p className="text-xs text-cyber-cyan/40 font-mono mt-1">{sub}</p>}
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
        <div className="w-10 h-10 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div>
        <p className="font-mono text-xs tracking-[0.3em] text-cyber-blue mb-2 neon-blue">
          ▸ TRAINING PROGRESS REPORT
        </p>
        <h1 className="text-2xl font-bold font-mono neon-cyan tracking-wider">DASHBOARD</h1>
        <div className="h-px bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-30 mt-3" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="SESSIONS" value={data.total_sessions} sub="completed" />
        <StatCard label="AVG SCORE" value={`${data.average_score}`} sub="out of 100" />
        <StatCard label="STREAK" value={`${data.current_streak}d`} sub="consecutive days" />
        <StatCard
          label="BEST SCENARIO"
          value={
            data.situation_stats.length > 0
              ? data.situation_stats.sort((a, b) => b.avg_score - a.avg_score)[0].title.split(" ")[0]
              : "—"
          }
        />
      </div>

      {data.daily_scores.length > 0 && (
        <div className="cyber-card">
          <h2 className="font-mono text-xs tracking-widest text-cyber-blue mb-5">
            ◈ SCORE TREND — LAST 30 DAYS
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.daily_scores}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,22,22,0.1)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#161616", opacity: 0.5, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={{ stroke: "rgba(22,22,22,0.2)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#161616", opacity: 0.5, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
                axisLine={{ stroke: "rgba(22,22,22,0.2)" }}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`${v}`, "Score"]}
                labelFormatter={(l) => `Date: ${l}`}
                contentStyle={{
                  background: "#FFFFFF",
                  border: "1.5px solid #161616",
                  borderRadius: "8px",
                  fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  fontSize: "12px",
                  color: "#161616",
                }}
              />
              <Line
                type="monotone"
                dataKey="avg_score"
                stroke="#E4002B"
                strokeWidth={2}
                dot={{ r: 3, fill: "#E4002B", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.situation_stats.length > 0 && (
        <div className="cyber-card">
          <h2 className="font-mono text-xs tracking-widest text-cyber-blue mb-5">
            ◈ PERFORMANCE BY SCENARIO
          </h2>
          <div className="space-y-4">
            {data.situation_stats.map((s) => (
              <div key={s.title} className="flex items-center gap-3">
                <span className="text-xs font-mono text-cyber-cyan/60 w-52 truncate">{s.title}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden"
                     style={{ background: "#F1F1F1", border: "1px solid rgba(22,22,22,0.12)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.avg_score}%`, background: "#E4002B" }}
                  />
                </div>
                <span className="text-xs font-mono text-cyber-cyan w-10 text-right">{s.avg_score}</span>
                <span className="text-xs font-mono text-cyber-cyan/30 w-12">×{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.weak_grammar_categories.length > 0 && (
        <div className="cyber-card">
          <h2 className="font-mono text-xs tracking-widest text-cyber-blue mb-5">
            ◈ よくある文法の弱点 TOP5
          </h2>
          <div className="space-y-4">
            {(() => {
              const max = Math.max(...data.weak_grammar_categories.map((c) => c.count));
              return data.weak_grammar_categories.map((c) => (
                <div key={c.code} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-cyber-cyan/60 w-40 truncate">{c.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden"
                       style={{ background: "#F1F1F1", border: "1px solid rgba(22,22,22,0.12)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(c.count / max) * 100}%`, background: "#E4002B" }}
                    />
                  </div>
                  <span className="text-xs font-mono text-cyber-cyan w-10 text-right">×{c.count}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {data.recent_sessions.length > 0 && (
        <div className="cyber-card">
          <h2 className="font-mono text-xs tracking-widest text-cyber-blue mb-5">
            ◈ RECENT SESSIONS
          </h2>
          <div className="space-y-1">
            {data.recent_sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className="w-full py-3 px-3 flex items-center justify-between rounded-lg transition-all duration-200 text-left group hover:bg-cyber-bg3"
              >
                <div>
                  <p className="text-sm font-mono text-cyber-cyan group-hover:neon-cyan transition-all">
                    {s.situation_title}
                  </p>
                  <p className="text-xs font-mono text-cyber-cyan/30 mt-0.5">
                    {new Date(s.started_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <div className="flex items-center gap-5 text-right">
                  <div>
                    <p className="text-sm font-bold font-mono text-cyber-cyan">{Math.round(s.total_score)}</p>
                    <p className="text-xs font-mono text-cyber-cyan/30">総合</p>
                  </div>
                  <div>
                    <p className="text-sm font-mono text-cyber-blue">{Math.round(s.grammar_score)}</p>
                    <p className="text-xs font-mono text-cyber-cyan/30">文法</p>
                  </div>
                  <div>
                    <p className="text-sm font-mono text-cyber-blue">{Math.round(s.fluency_score)}</p>
                    <p className="text-xs font-mono text-cyber-cyan/30">流暢さ</p>
                  </div>
                  <span className="text-cyber-cyan/30 group-hover:text-cyber-cyan transition-colors">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {data.total_sessions === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4 opacity-30">◈</p>
          <p className="font-mono text-cyber-cyan/40 tracking-widest text-sm">NO SESSION DATA</p>
          <p className="text-xs font-mono text-cyber-cyan/20 mt-2">Complete your first session to see stats here</p>
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
