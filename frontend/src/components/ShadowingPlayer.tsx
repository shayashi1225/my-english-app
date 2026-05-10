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

  function similarity(a: string, b: string): number {
    const wa = a.toLowerCase().split(/\s+/);
    const wb = b.toLowerCase().split(/\s+/);
    const matched = wa.filter((w) => wb.includes(w)).length;
    return Math.round((matched / Math.max(wa.length, wb.length)) * 100);
  }

  const score = userText ? similarity(item.corrected, userText) : null;
  const scoreColor = score === null ? "" :
    score >= 80 ? "text-cyber-green border-cyber-green" :
    score >= 50 ? "text-cyber-yellow border-cyber-yellow" :
    "text-cyber-red border-cyber-red";

  return (
    <div className="cyber-card space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-xs font-mono text-cyber-blue mt-0.5">#{index + 1}</span>
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-xs font-mono tracking-widest text-cyber-cyan/30 mb-1">▸ 元の発話</p>
            <p className="text-sm font-mono text-cyber-cyan/50 italic">"{item.original}"</p>
          </div>
          <div>
            <p className="text-xs font-mono tracking-widest text-cyber-blue mb-1">▸ 修正文（目標）</p>
            <p className="text-sm font-mono text-cyber-cyan">"{item.corrected}"</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handlePlay}
          disabled={playing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyber-blue text-cyber-blue text-xs font-mono hover:bg-cyber-blue/10 disabled:opacity-30 transition-all"
          style={!playing ? { boxShadow: "none" } : { boxShadow: "0 0 8px rgba(30,144,255,0.3)" }}
        >
          {playing ? "⏸" : "🔊"} {playing ? "再生中..." : "聴く"}
        </button>

        {!getSR() ? (
          <span className="text-xs font-mono text-cyber-red/60 self-center">⚠ Chrome が必要です</span>
        ) : recordState === "idle" || recordState === "done" ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyber-red text-cyber-red text-xs font-mono hover:bg-cyber-red/10 transition-all"
          >
            🎤 練習する
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-cyber-red bg-cyber-red/20 text-cyber-red text-xs font-mono animate-pulse"
            style={{ boxShadow: "0 0 12px rgba(255,45,85,0.4)" }}
          >
            ⏹ 停止
          </button>
        )}

        {recordState === "done" && (
          <button
            onClick={reset}
            className="px-3 py-2 rounded-lg text-cyber-cyan/30 text-sm font-mono hover:text-cyber-cyan transition-colors"
          >
            ↺
          </button>
        )}
      </div>

      {/* Result */}
      {recordState === "done" && userText && (
        <div className="rounded-lg border border-cyber-border px-4 py-3 space-y-2"
             style={{ background: "rgba(0,0,68,0.6)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono tracking-widest text-cyber-cyan/40">▸ あなたの発話</p>
            {score !== null && (
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${scoreColor}`}>
                一致率 {score}%
              </span>
            )}
          </div>
          <p className="text-sm font-mono text-cyber-cyan/70">"{userText}"</p>
        </div>
      )}
    </div>
  );
}

export default function ShadowingPlayer({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="text-xs font-mono text-cyber-cyan/30 text-center py-6 tracking-widest">
        このセッションには修正文がありません
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-mono text-cyber-cyan/40 tracking-wide">
        ▸ 「聴く」で正しい発音を確認し、「練習する」で声に出して繰り返しましょう
      </p>
      {items.map((item, i) => (
        <ShadowingCard key={i} item={item} index={i} />
      ))}
    </div>
  );
}
