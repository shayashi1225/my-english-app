import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api, Feedback, SessionSummary, Situation } from "../services/api";
import VoiceRecorder from "../components/VoiceRecorder";
import FeedbackPanel from "../components/FeedbackPanel";
import SessionSummaryView from "../components/SessionSummary";
import { SpeakerIcon } from "../components/Icons";

interface Message { speaker: "ai" | "user"; text: string; }
type Phase = "ready" | "conversation" | "processing" | "summary";

async function speak(text: string, sessionId: number | undefined, onEnd: () => void, onError: (m: string) => void) {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, session_id: sessionId ?? null }),
    });
    if (!res.ok) throw new Error(`TTS ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); onEnd(); };
    audio.onerror  = () => { URL.revokeObjectURL(url); onError("Audio playback failed"); onEnd(); };
    await audio.play();
  } catch (e) { onError(String(e)); onEnd(); }
}

export default function Conversation() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { aiMessage: string; situation: Situation } | null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [processing, setProcessing] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<{ feedback: Feedback; userText: string } | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.aiMessage) setMessages([{ speaker: "ai", text: state.aiMessage }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, latestFeedback]);

  function doSpeak(text: string) {
    setIsSpeaking(true);
    setSpeechError(null);
    speak(text, sessionId ? Number(sessionId) : undefined, () => setIsSpeaking(false), (m) => setSpeechError(m));
  }

  function handleStart() {
    if (!state?.aiMessage) return;
    setPhase("conversation");
    doSpeak(state.aiMessage);
  }

  const handleUserSpeech = useCallback(async (text: string) => {
    if (!sessionId || processing) return;
    setMessages((p) => [...p, { speaker: "user", text }]);
    setProcessing(true);
    setLatestFeedback(null);
    try {
      const res = await api.sendTurn(Number(sessionId), text);
      if (res.feedback) setLatestFeedback({ feedback: res.feedback, userText: text });
      setMessages((p) => [...p, { speaker: "ai", text: res.ai_message }]);
      doSpeak(res.ai_message);
      if (res.is_last_turn) {
        setTimeout(async () => {
          const summaryData = await api.completeSession(Number(sessionId));
          setSummary(summaryData);
          setPhase("summary");
        }, 3000);
      }
    } finally { setProcessing(false); }
  }, [sessionId, processing]);

  if (!state) { navigate("/"); return null; }
  if (phase === "summary" && summary) {
    return <SessionSummaryView data={summary} sessionId={Number(sessionId)} />;
  }

  const userTurns = messages.filter((m) => m.speaker === "user").length;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-cyber-border px-4 py-3 flex items-center gap-3 bg-white">
        <button
          onClick={() => { if (confirm("End this session?")) navigate("/"); }}
          className="text-cyber-cyan/40 hover:text-cyber-red transition-colors font-mono"
        >✕</button>
        <div className="flex-1">
          <p className="font-mono text-xs tracking-widest text-cyber-blue">◈ {state.situation.title.toUpperCase()}</p>
          <p className="font-mono text-[10px] text-cyber-cyan/40 tracking-widest">TURN {userTurns} / 6</p>
        </div>
        {/* Progress bar */}
        <div className="w-24 h-1 bg-cyber-bg3 rounded-full overflow-hidden">
          <div className="h-full bg-cyber-cyan transition-all duration-500 rounded-full"
               style={{ width: `${(userTurns / 6) * 100}%` }} />
        </div>
        <div className={`w-2 h-2 rounded-full ml-2 ${isSpeaking ? "bg-cyber-blue animate-pulse" : "bg-cyber-green"}`} />
      </div>

      {/* Speech error */}
      {speechError && (
        <div className="border-b border-cyber-red/40 px-4 py-2 text-cyber-red text-xs font-mono flex justify-between bg-cyber-red/5">
          <span>⚠ {speechError}</span>
          <button onClick={() => setSpeechError(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.speaker === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-sm lg:max-w-md px-4 py-3 rounded-lg text-sm font-mono leading-relaxed border
              ${msg.speaker === "ai"
                ? "border-cyber-border text-cyber-cyan bg-cyber-bg3"
                : "border-cyber-blue text-cyber-cyan bg-cyber-blue/8"
              }`}
            >
              {msg.speaker === "ai" && (
                <button
                  onClick={() => doSpeak(msg.text)}
                  disabled={isSpeaking}
                  className="float-right ml-2 w-4 h-4 text-cyber-cyan/40 hover:text-cyber-cyan disabled:opacity-20 transition-colors"
                  title="Replay"
                ><SpeakerIcon /></button>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {processing && (
          <div className="flex justify-start">
            <div className="border border-cyber-border rounded-lg px-4 py-3 font-mono text-xs text-cyber-cyan/60 bg-cyber-bg3">
              <span className="animate-pulse">▸ PROCESSING</span>
              {[0,1,2].map((i) => (
                <span key={i} className="inline-block w-1 h-1 bg-cyber-cyan rounded-full mx-0.5 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {latestFeedback && (
          <FeedbackPanel feedback={latestFeedback.feedback} userText={latestFeedback.userText} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="border-t border-cyber-border px-4 py-5 bg-white">
        {phase === "ready" ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-mono tracking-widest text-cyber-cyan/50">
              ▸ READY TO BEGIN SESSION
            </p>
            <button onClick={handleStart} className="cyber-btn text-base px-10 py-3 animate-pulse-neon flex items-center gap-2">
              <span className="w-4 h-4"><SpeakerIcon /></span> START SESSION
            </button>
          </div>
        ) : (
          <VoiceRecorder onResult={handleUserSpeech} disabled={processing || isSpeaking} />
        )}
      </div>
    </div>
  );
}
