import { useRef, useState } from "react";

interface ShadowingItem {
  original: string;
  corrected: string;
}

interface Props {
  items: ShadowingItem[];
}

type RecordingState = "idle" | "recording" | "done";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;
function getSR(): SR | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

async function playTTS(text: string): Promise<void> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    audio.play();
  });
}

function ShadowingCard({ item, index }: { item: ShadowingItem; index: number }) {
  const [playing, setPlaying] = useState(false);
  const [recordState, setRecordState] = useState<RecordingState>("idle");
  const [userText, setUserText] = useState("");
  const recognitionRef = useRef<SR>(null);
  const accumulatedRef = useRef("");

  async function handlePlay() {
    setPlaying(true);
    await playTTS(item.corrected);
    setPlaying(false);
  }

  function startRecording() {
    const SRClass = getSR();
    if (!SRClass) return;

    accumulatedRef.current = "";
    setUserText("");
    setRecordState("recording");

    const recognition = new SRClass();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (e: SR) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          accumulatedRef.current += e.results[i][0].transcript + " ";
        }
      }
    };

    recognition.onend = () => {
      setRecordState("done");
      setUserText(accumulatedRef.current.trim());
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
  }

  function reset() {
    setRecordState("idle");
    setUserText("");
  }

  // Simple similarity: count matching words
  function similarity(a: string, b: string): number {
    const wa = a.toLowerCase().split(/\s+/);
    const wb = b.toLowerCase().split(/\s+/);
    const matched = wa.filter((w) => wb.includes(w)).length;
    return Math.round((matched / Math.max(wa.length, wb.length)) * 100);
  }

  const score = userText ? similarity(item.corrected, userText) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold text-gray-400 mt-0.5">#{index + 1}</span>
        <div className="flex-1 space-y-1">
          <p className="text-xs text-gray-400">元の発話</p>
          <p className="text-sm text-gray-500 italic">"{item.original}"</p>
          <p className="text-xs text-gray-400 mt-2">修正文（目標）</p>
          <p className="text-sm font-medium text-gray-800">"{item.corrected}"</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handlePlay}
          disabled={playing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          {playing ? "⏸" : "🔊"} {playing ? "再生中..." : "聴く"}
        </button>

        {!getSR() ? (
          <span className="text-xs text-red-400 self-center">Chrome が必要です</span>
        ) : recordState === "idle" || recordState === "done" ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
          >
            🎤 練習する
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium animate-pulse"
          >
            ⏹ 停止
          </button>
        )}

        {recordState === "done" && (
          <button
            onClick={reset}
            className="px-3 py-2 rounded-xl text-gray-400 text-sm hover:text-gray-600 transition-colors"
          >
            ↺
          </button>
        )}
      </div>

      {/* Result */}
      {recordState === "done" && userText && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-medium">あなたの発話</p>
            {score !== null && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full
                  ${score >= 80 ? "bg-green-100 text-green-700" :
                    score >= 50 ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"}`}
              >
                一致率 {score}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700">"{userText}"</p>
        </div>
      )}
    </div>
  );
}

export default function ShadowingPlayer({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        このセッションには修正文がありません
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        「聴く」で正しい発音を確認し、「練習する」で声に出して繰り返しましょう
      </p>
      {items.map((item, i) => (
        <ShadowingCard key={i} item={item} index={i} />
      ))}
    </div>
  );
}
