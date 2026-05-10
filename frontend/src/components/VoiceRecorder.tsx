import { useEffect, useRef, useState } from "react";

interface Props {
  onResult: (text: string) => void;
  disabled?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;
function getSR(): SR | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function VoiceRecorder({ onResult, disabled }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SR>(null);
  const accumulatedRef = useRef("");

  useEffect(() => {
    const SRClass = getSR();
    if (!SRClass) return;
    const recognition = new SRClass();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e: SR) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const seg = e.results[i][0].transcript;
        if (e.results[i].isFinal) accumulatedRef.current += seg + " ";
        else interim += seg;
      }
      setTranscript((accumulatedRef.current + interim).trim());
    };

    recognition.onend = () => {
      setIsRecording(false);
      const result = accumulatedRef.current.trim() || transcript.trim();
      if (result) { setTranscript(""); accumulatedRef.current = ""; onResult(result); }
    };

    recognition.onerror = (e: SR) => {
      if (e.error !== "aborted") console.error("SR error:", e.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  function toggle() {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      accumulatedRef.current = "";
      setTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }

  if (!getSR()) {
    return (
      <div className="text-center p-4 border border-cyber-red rounded-xl text-cyber-red text-xs font-mono">
        ⚠ SPEECH RECOGNITION NOT SUPPORTED — USE CHROME
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={toggle}
        disabled={disabled}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center text-2xl
          transition-all duration-200 font-mono border-2
          ${isRecording
            ? "recording-pulse border-cyber-red text-cyber-red bg-cyber-bg2"
            : "border-cyber-cyan text-cyber-cyan bg-cyber-bg2 hover:shadow-neon-cyan"
          }
          disabled:opacity-30 disabled:cursor-not-allowed`}
        style={isRecording ? { boxShadow: "0 0 16px rgba(255,45,85,0.6)" } : {}}
      >
        {isRecording ? "⏹" : "🎤"}
      </button>

      <p className="text-xs font-mono tracking-widest text-cyber-cyan/60">
        {disabled ? "▸ PROCESSING..." : isRecording ? "▸ REC — CLICK TO SEND" : "▸ CLICK TO SPEAK"}
      </p>

      {transcript && (
        <div className="w-full max-w-md border border-cyber-border rounded-lg px-4 py-3 text-cyber-cyan/80 text-sm font-mono italic"
             style={{ background: "rgba(0,0,68,0.6)" }}>
          {transcript}
        </div>
      )}
    </div>
  );
}
