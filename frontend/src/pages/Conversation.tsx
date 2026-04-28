import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api, Feedback, SessionSummary, Situation } from "../services/api";
import VoiceRecorder from "../components/VoiceRecorder";
import FeedbackPanel from "../components/FeedbackPanel";
import SessionSummaryView from "../components/SessionSummary";

interface Message {
  speaker: "ai" | "user";
  text: string;
}

type Phase = "ready" | "conversation" | "processing" | "summary";

// Generate audio via backend (gTTS) and play it with the Audio API
async function speak(
  text: string,
  onEnd: () => void,
  onError: (msg: string) => void
): Promise<void> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      onEnd();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      onError("Audio playback failed");
      onEnd();
    };
    await audio.play();
  } catch (e) {
    onError(String(e));
    onEnd();
  }
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
    if (state?.aiMessage) {
      setMessages([{ speaker: "ai", text: state.aiMessage }]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, latestFeedback]);

  function doSpeak(text: string) {
    setIsSpeaking(true);
    setSpeechError(null);
    speak(
      text,
      () => setIsSpeaking(false),
      (msg) => setSpeechError(msg)
    );
  }

  function handleStart() {
    if (!state?.aiMessage) return;
    setPhase("conversation");
    doSpeak(state.aiMessage);
  }

  const handleUserSpeech = useCallback(
    async (text: string) => {
      if (!sessionId || processing) return;

      setMessages((prev) => [...prev, { speaker: "user", text }]);
      setProcessing(true);
      setLatestFeedback(null);

      try {
        const res = await api.sendTurn(Number(sessionId), text);

        if (res.feedback) {
          setLatestFeedback({ feedback: res.feedback, userText: text });
        }

        setMessages((prev) => [...prev, { speaker: "ai", text: res.ai_message }]);
        doSpeak(res.ai_message);

        if (res.is_last_turn) {
          setTimeout(async () => {
            const summaryData = await api.completeSession(Number(sessionId));
            setSummary(summaryData);
            setPhase("summary");
          }, 3000);
        }
      } finally {
        setProcessing(false);
      }
    },
    [sessionId, processing]
  );

  if (!state) {
    navigate("/");
    return null;
  }

  if (phase === "summary" && summary) {
    return <SessionSummaryView data={summary} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => { if (confirm("End this session?")) navigate("/"); }}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{state.situation.title}</p>
          <p className="text-xs text-gray-400">
            {messages.filter((m) => m.speaker === "user").length} / 6 turns
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isSpeaking && (
            <span className="text-xs text-blue-500 animate-pulse">Speaking...</span>
          )}
          <div className={`w-2 h-2 rounded-full ${isSpeaking ? "bg-blue-400 animate-pulse" : "bg-green-400"}`} />
        </div>
      </div>

      {/* Speech error banner */}
      {speechError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-red-600 text-xs flex justify-between items-center">
          <span>⚠ {speechError}</span>
          <button onClick={() => setSpeechError(null)} className="ml-4 font-bold">✕</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.speaker === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-sm lg:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${msg.speaker === "ai"
                  ? "bg-white border border-gray-200 text-gray-800"
                  : "bg-blue-600 text-white"
                }`}
            >
              {msg.speaker === "ai" && (
                <button
                  onClick={() => doSpeak(msg.text)}
                  disabled={isSpeaking}
                  className="float-right ml-2 text-gray-400 hover:text-blue-400 disabled:opacity-30 text-base"
                  title="Replay"
                >
                  🔊
                </button>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {processing && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {latestFeedback && (
          <FeedbackPanel feedback={latestFeedback.feedback} userText={latestFeedback.userText} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-5">
        {phase === "ready" ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500">ボタンを押してセッションを開始します</p>
            <button
              onClick={handleStart}
              className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              🔊 Start Session
            </button>
          </div>
        ) : (
          <VoiceRecorder
            onResult={handleUserSpeech}
            disabled={processing || isSpeaking}
          />
        )}
      </div>
    </div>
  );
}
