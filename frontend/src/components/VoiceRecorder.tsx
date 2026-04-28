import { useEffect, useRef, useState } from "react";

interface Props {
  onResult: (text: string) => void;
  disabled?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SR = any;

function getSR(): SR | null {
  if (typeof window === "undefined") return null;
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
        const segment = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          accumulatedRef.current += segment + " ";
        } else {
          interim += segment;
        }
      }
      setTranscript((accumulatedRef.current + interim).trim());
    };

    // onend fires when recognition stops (manual stop or auto).
    // Submit whatever was accumulated.
    recognition.onend = () => {
      setIsRecording(false);
      const result = accumulatedRef.current.trim() || transcript.trim();
      if (result) {
        setTranscript("");
        accumulatedRef.current = "";
        onResult(result);
      }
    };

    recognition.onerror = (e: SR) => {
      if (e.error !== "aborted") console.error("SpeechRecognition error:", e.error);
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
      <div className="text-center p-4 bg-red-50 rounded-xl text-red-600 text-sm">
        Speech recognition is not supported. Please use Chrome.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={toggle}
        disabled={disabled}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all
          ${isRecording
            ? "bg-red-500 text-white recording-pulse shadow-lg"
            : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
          }
          disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {isRecording ? "⏹" : "🎤"}
      </button>

      <p className="text-sm text-gray-500">
        {disabled
          ? "Please wait..."
          : isRecording
          ? "Recording... click to send"
          : "Click to speak"}
      </p>

      {transcript && (
        <div className="w-full max-w-md bg-gray-100 rounded-xl px-4 py-3 text-gray-700 text-sm italic">
          {transcript}
        </div>
      )}
    </div>
  );
}
