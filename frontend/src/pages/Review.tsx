import { useEffect, useState } from "react";
import { api, ReviewItem, ReviewRating } from "../services/api";
import { playTTS } from "../lib/tts";
import { SpeakerIcon } from "../components/Icons";

export default function Review() {
  const [items, setItems] = useState<ReviewItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    api.getReviewQueue(20).then((q) => {
      setItems(q.items);
      setTotal(q.items.length);
    });
  }, []);

  async function handleSpeak(text: string) {
    setSpeaking(true);
    await playTTS(text);
    setSpeaking(false);
  }

  async function handleAnswer(rating: ReviewRating) {
    if (!items || items.length === 0) return;
    const current = items[0];
    await api.answerReview(current.id, rating);
    setItems(items.slice(1));
    setFlipped(false);
  }

  if (items === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <p className="font-mono text-xs tracking-[0.3em] text-cyber-blue mb-2 neon-blue">
          ▸ SPACED REPETITION
        </p>
        <h1 className="text-2xl font-bold font-mono neon-cyan tracking-wider">REVIEW</h1>
        <div className="h-px bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-30 mt-3" />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4 opacity-30">◈</p>
          <p className="font-mono text-cyber-cyan/40 tracking-widest text-sm">復習すべき項目はありません</p>
          <p className="text-xs font-mono text-cyber-cyan/20 mt-2">セッションを完了すると新しい表現が復習キューに追加されます</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-mono text-cyber-cyan/40 tracking-widest text-center">
            残り {items.length} / {total}
          </p>

          <div className="cyber-card min-h-[280px] flex flex-col">
            <p className="text-xs font-mono text-cyber-blue tracking-widest mb-1">{items[0].situation_title}</p>

            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold font-mono text-cyber-cyan text-center">
                  {items[0].word_or_phrase}
                </h2>
                <button
                  onClick={() => handleSpeak(items[0].word_or_phrase)}
                  disabled={speaking}
                  className="w-5 h-5 text-cyber-cyan/50 hover:text-cyber-cyan disabled:opacity-30 transition-colors"
                >
                  <SpeakerIcon />
                </button>
              </div>

              {!flipped ? (
                <button onClick={() => setFlipped(true)} className="cyber-btn text-xs px-6 py-2 mt-4">
                  タップして意味を見る
                </button>
              ) : (
                <div className="w-full space-y-3 text-center">
                  <p className="text-cyber-cyan/70 text-sm">{items[0].explanation}</p>
                  {items[0].example_sentence && (
                    <p className="text-cyber-cyan/40 text-xs italic border-l-2 border-cyber-cyan/20 pl-3 text-left">
                      例: {items[0].example_sentence}
                    </p>
                  )}
                </div>
              )}
            </div>

            {flipped && (
              <div className="flex gap-2 pt-2">
                <button onClick={() => handleAnswer("again")} className="cyber-btn-red flex-1 py-2 text-xs">
                  もう一度
                </button>
                <button
                  onClick={() => handleAnswer("hard")}
                  className="flex-1 py-2 text-xs rounded font-mono uppercase tracking-widest border-[1.5px] border-cyber-yellow text-cyber-yellow bg-white hover:bg-cyber-yellow hover:text-white transition-all"
                >
                  あいまい
                </button>
                <button onClick={() => handleAnswer("good")} className="cyber-btn-blue flex-1 py-2 text-xs">
                  覚えた
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
