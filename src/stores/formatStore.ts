import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AudioFormat = "mp3" | "wav";

interface FormatState {
  outputFormat: AudioFormat;
  setOutputFormat: (format: AudioFormat) => void;
}

export const useFormatStore = create<FormatState>()(
  persist(
    (set) => ({
      outputFormat: "wav", // Default to WAV as requested
      setOutputFormat: (format) => set({ outputFormat: format }),
    }),
    {
      name: "audio-format-preference",
    }
  )
);
