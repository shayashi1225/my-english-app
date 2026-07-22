import { Feedback } from "../services/api";

interface Props {
  feedback: Feedback;
  userText: string;
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 8 ? "text-cyber-green border-cyber-green" :
              score >= 6 ? "text-cyber-yellow border-cyber-yellow" :
                           "text-cyber-red border-cyber-red";
  return (
    <span className={`inline-block px-2 py-0.5 rounded border font-mono text-xs ${cls}`}>
      {score.toFixed(1)}/10
    </span>
  );
}

export default function FeedbackPanel({ feedback, userText }: Props) {
  return (
    <div className="cyber-card space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs tracking-widest text-cyber-blue">◈ FEEDBACK</span>
        <ScoreBadge score={feedback.grammar_score} />
      </div>

      <blockquote className="border-l-2 border-cyber-cyan/40 pl-3 text-cyber-cyan/70 text-sm italic font-mono">
        "{userText}"
      </blockquote>

      {feedback.positive_feedback && (
        <div className="flex gap-2 text-cyber-green text-xs font-mono border border-cyber-green/30 rounded px-3 py-2 bg-cyber-green/5">
          <span>✓</span><span>{feedback.positive_feedback}</span>
        </div>
      )}

      {feedback.corrected_text && feedback.corrected_text !== userText && (
        <div className="text-xs">
          <p className="text-cyber-blue font-mono tracking-widest mb-1">▸ CORRECTION</p>
          <p className="font-mono text-cyber-cyan border border-cyber-border rounded px-3 py-2 bg-cyber-bg3">
            "{feedback.corrected_text}"
          </p>
        </div>
      )}

      {feedback.grammar_issues?.length > 0 && (
        <div className="text-xs">
          <p className="text-cyber-blue font-mono tracking-widest mb-2">▸ GRAMMAR NOTES</p>
          <ul className="space-y-1">
            {feedback.grammar_issues.map((issue, i) => (
              <li key={i} className="flex gap-2 text-cyber-cyan/70 font-mono">
                <span className="text-cyber-yellow">—</span>{issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.pronunciation_tips?.length > 0 && (
        <div className="text-xs">
          <p className="text-cyber-blue font-mono tracking-widest mb-2">▸ PRONUNCIATION</p>
          <ul className="space-y-1">
            {feedback.pronunciation_tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-cyber-cyan/70 font-mono">
                <span className="text-cyber-purple">♪</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
