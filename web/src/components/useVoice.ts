import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

const MUTE_KEY = "flame.voice.muted";

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Push-to-talk recording (sent to ElevenLabs through the server) and spoken answers. */
export function useVoice(runId: string, enabled: boolean) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMutedState] = useState(readMuted);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const supported = enabled && typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices;

  const setMuted = (m: boolean) => {
    setMutedState(m);
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* private mode */
    }
    if (m) stopSpeaking();
  };

  const start = useCallback(async () => {
    if (!supported || recording) return;
    setError(null);
    stopSpeaking();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: type });
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.start();
      recorder.current = rec;
      setRecording(true);
    } catch {
      setError("Microphone access was refused. Typing still works.");
    }
  }, [supported, recording]);

  /** Stops recording and resolves to the transcribed text ("" if nothing was said). */
  const stop = useCallback(async (): Promise<string> => {
    const rec = recorder.current;
    if (!rec) return "";
    const done = new Promise<void>((resolve) => (rec.onstop = () => resolve()));
    rec.stop();
    rec.stream.getTracks().forEach((t) => t.stop());
    await done;
    recorder.current = null;
    setRecording(false);
    const blob = new Blob(chunks.current, { type: rec.mimeType });
    if (blob.size < 2000) return "";
    setTranscribing(true);
    try {
      return (await api.transcribe(blob, runId)).text;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Voice is unavailable right now; typing still works.");
      return "";
    } finally {
      setTranscribing(false);
    }
  }, [runId]);

  const speak = useCallback(
    async (text: string) => {
      if (!enabled || muted || !text) return;
      stopSpeaking();
      try {
        const res = await fetch("/api/voice/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        if (!res.ok) throw new Error("tts");
        const url = URL.createObjectURL(await res.blob());
        const el = new Audio(url);
        audio.current = el;
        el.onended = () => {
          setSpeaking(false);
          URL.revokeObjectURL(url);
        };
        setSpeaking(true);
        await el.play();
      } catch {
        setSpeaking(false);
        setError("The answer could not be read aloud; it is shown as text.");
      }
    },
    [enabled, muted],
  );

  function stopSpeaking() {
    audio.current?.pause();
    audio.current = null;
    setSpeaking(false);
  }

  useEffect(() => () => stopSpeaking(), []);

  return { supported, recording, transcribing, speaking, muted, setMuted, error, start, stop, speak, stopSpeaking };
}
