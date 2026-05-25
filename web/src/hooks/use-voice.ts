"use client";

import { useCallback, useRef, useState } from "react";
import { synthesizeSpeech, transcribeAudio } from "@/lib/api-client";
import { getSettings } from "@/lib/storage";
import { toast } from "sonner";

export function useVoice() {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) {
        reject(new Error("No recorder"));
        return;
      }
      recorder.onstop = async () => {
        setRecording(false);
        recorder.stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        try {
          const text = await transcribeAudio(blob);
          resolve(text);
        } catch (e) {
          toast.error((e as Error).message);
          reject(e);
        }
      };
      recorder.stop();
    });
  }, []);

  const playText = useCallback(async (text: string) => {
    const settings = getSettings();
    try {
      setPlaying(true);
      const blob = await synthesizeSpeech(text, settings.ttsProvider);
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (e) {
      setPlaying(false);
      toast.error(
        (e as Error).message ||
          "TTS unavailable. Configure ELEVENLABS_API_KEY in backend .env",
      );
    }
  }, []);

  return {
    recording,
    playing,
    startRecording,
    stopRecording,
    playText,
  };
}
