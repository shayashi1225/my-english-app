import { Feedback } from "../services/api";

interface Props {
  feedback: Feedback;
  userText: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? "bg-green-100 text-green-700" :
    score >= 6 ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score.toFixed(1)}/10
    </span>
  );
}

export default function FeedbackPanel({ feedback, userText }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-800">Your response</span>
        <ScoreBadge score={feedback.grammar_score} />
      </div>

      <blockquote className="text-gray-600 italic border-l-4 border-blue-200 pl-3">
        "{userText}"
      </blockquote>

      {feedback.positive_feedback && (
        <div className="flex gap-2 text-green-700 text-sm bg-green-50 rounded-xl px-4 py-3">
          <span>✓</span>
          <span>{feedback.positive_feedback}</span>
        </div>
      )}

      {feedback.corrected_text && feedback.corrected_text !== userText && (
        <div className="text-sm">
          <p className="text-gray-500 mb-1 font-medium">Suggested correction:</p>
          <p className="text-blue-700 bg-blue-50 rounded-xl px-4 py-2">
            "{feedback.corrected_text}"
          </p>
        </div>
      )}

      {feedback.grammar_issues && feedback.grammar_issues.length > 0 && (
        <div className="text-sm">
          <p className="text-gray-500 mb-2 font-medium">Grammar notes:</p>
          <ul className="space-y-1">
            {feedback.grammar_issues.map((issue, i) => (
              <li key={i} className="flex gap-2 text-gray-700">
                <span className="text-yellow-500">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.pronunciation_tips && feedback.pronunciation_tips.length > 0 && (
        <div className="text-sm">
          <p className="text-gray-500 mb-2 font-medium">Pronunciation tips:</p>
          <ul className="space-y-1">
            {feedback.pronunciation_tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-gray-700">
                <span className="text-purple-400">♪</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
