import { useEffect, useState } from "react";
import { api, ReviewItem, ReviewRating, SpeakEvaluation } from "../services/api";
import VoiceRecorder from "./VoiceRecorder";

interface Props {
  item: ReviewItem;
  onAnswer: (rating: ReviewRating) => void;
}

export default function SpeakingReviewCard({ item, onAnswer }: Props) {
  const [spokenText, setSpokenText] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<SpeakEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSpokenText("");
    setEvaluating(false);
    setEvaluation(null);
    setError(null);
  }, [item.id]);

  async function handleResult(text: string) {
    setSpokenText(text);
    setEvaluating(true);
    setError(null);
    try {
      const result = await api.evaluateSpeaking(item.id, text);
      setEvaluation(result);
    } catch {
      setError("評価に失敗しました。もう一度お試しください。");
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="cyber-card min-h-[320px] flex flex-col">
      <p className="text-xs font-mono text-cyber-blue tracking-widest mb-1">{item.situation_title}</p>

      <div className="flex-1 flex flex-col items-center justify-center gap-5 py-6 text-center">
        <p className="text-xs font-mono text-cyber-cyan/40 tracking-widest">▸ この意味を英語で言ってみましょう</p>
        <p className="text-cyber-cyan text-lg leading-relaxed">{item.meaning_ja || item.explanation}</p>

        {!evaluation && !evaluating && (
          <VoiceRecorder onResult={handleResult} disabled={evaluating} />
        )}

        {evaluating && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-cyber-cyan/60 text-sm font-mono italic">"{spokenText}"</p>
            <div className="w-8 h-8 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-cyber-cyan/40 tracking-widest">▸ 評価中...</p>
          </div>
        )}

        {error && (
          <div className="text-cyber-red text-xs font-mono border border-cyber-red/40 rounded px-3 py-2">
            ⚠ {error}
          </div>
        )}

        {evaluation && (
          <div className="w-full space-y-3 text-left">
            <div className="flex items-center justify-center gap-2">
              <span
                className={`inline-block px-2 py-0.5 rounded border font-mono text-xs ${
                  evaluation.is_correct
                    ? "text-cyber-green border-cyber-green"
                    : "text-cyber-red border-cyber-red"
                }`}
              >
                {evaluation.is_correct ? "✓ 正解" : "✗ 不正解"}
              </span>
              <span className="inline-block px-2 py-0.5 rounded border font-mono text-xs text-cyber-cyan border-cyber-cyan/40">
                {evaluation.score.toFixed(1)}/10
              </span>
            </div>

            <blockquote className="border-l-2 border-cyber-cyan/40 pl-3 text-cyber-cyan/70 text-sm italic font-mono">
              あなたの回答: "{spokenText}"
            </blockquote>

            <div className="text-xs">
              <p className="text-cyber-blue font-mono tracking-widest mb-1">▸ 正解の表現</p>
              <p className="font-mono text-cyber-cyan border border-cyber-border rounded px-3 py-2 bg-cyber-bg3">
                {evaluation.correct_answer}
              </p>
            </div>

            {evaluation.feedback && (
              <p className="text-cyber-cyan/70 text-xs font-mono">{evaluation.feedback}</p>
            )}

            {evaluation.pronunciation_tips?.length > 0 && (
              <div className="text-xs">
                <p className="text-cyber-blue font-mono tracking-widest mb-2">▸ 発音アドバイス</p>
                <ul className="space-y-1">
                  {evaluation.pronunciation_tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-cyber-cyan/70 font-mono">
                      <span className="text-cyber-purple">♪</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {evaluation && (
        <div className="flex gap-2 pt-2">
          <button onClick={() => onAnswer("again")} className="cyber-btn-red flex-1 py-2 text-xs">
            もう一度
          </button>
          <button
            onClick={() => onAnswer("hard")}
            className="flex-1 py-2 text-xs rounded font-mono uppercase tracking-widest border-[1.5px] border-cyber-yellow text-cyber-yellow bg-white hover:bg-cyber-yellow hover:text-white transition-all"
          >
            あいまい
          </button>
          <button onClick={() => onAnswer("good")} className="cyber-btn-blue flex-1 py-2 text-xs">
            覚えた
          </button>
        </div>
      )}
    </div>
  );
}
