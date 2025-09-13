export interface TTSRequest {
  mode: "tts";
  text: string;
  language_id?: string;
  voice_sample_base64?: string;
  return_format?: "base64";
  repetition_penalty?: number;
  min_p?: number;
  top_p?: number;
  exaggeration?: number;
  cfg_weight?: number;
  temperature?: number;
}

export interface VoiceCloneRequest {
  mode: "voice_clone";
  source_audio_base64: string;
  target_voice_base64: string;
  return_format?: "base64";
}

export interface TTSResponse {
  audio_base64?: string;
  error?: string;
  sample_rate?: number;
  format?: string;
  language_id?: string;
  model_type?: string;
  mode?: string;
  voice_cloned?: boolean;
}

export interface VoiceCloneResponse {
  audio_base64?: string;
  error?: string;
  sample_rate?: number;
  format?: string;
  model_type?: string;
  mode?: string;
}

class RunPodAPI {
  private endpoint: string;
  private apiKey: string;

  constructor() {
    this.endpoint = import.meta.env.VITE_RUNPOD_ENDPOINT || "";
    this.apiKey = import.meta.env.VITE_RUNPOD_API_KEY || "";

    if (!this.endpoint || !this.apiKey) {
      console.warn(
        "RunPod endpoint or API key not configured. Please set VITE_RUNPOD_ENDPOINT and VITE_RUNPOD_API_KEY environment variables."
      );
    }
  }

  private async makeRequest(
    input: TTSRequest | VoiceCloneRequest
  ): Promise<any> {
    if (!this.endpoint || !this.apiKey) {
      throw new Error(
        "RunPod API not configured. Please check your environment variables."
      );
    }

    const response = await fetch(
      `https://api.runpod.ai/v2/${this.endpoint}/runsync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ input }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  async generateTTS(request: TTSRequest): Promise<TTSResponse> {
    try {
      const data = await this.makeRequest(request);
      return data.output || data;
    } catch (error) {
      console.error("TTS API Error:", error);
      throw error;
    }
  }

  async cloneVoice(request: VoiceCloneRequest): Promise<VoiceCloneResponse> {
    try {
      const data = await this.makeRequest(request);
      return data.output || data;
    } catch (error) {
      console.error("Voice Clone API Error:", error);
      throw error;
    }
  }

  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix to get just the base64 data
        const base64Data = base64.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  createAudioBlob(base64Audio: string, mimeType: string = "audio/wav"): Blob {
    const audioData = Uint8Array.from(atob(base64Audio), (c) =>
      c.charCodeAt(0)
    );
    return new Blob([audioData], { type: mimeType });
  }

  downloadAudio(
    base64Audio: string,
    filename: string = `generated_audio_${Date.now()}.wav`
  ): void {
    const audioBlob = this.createAudioBlob(base64Audio);
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const runPodAPI = new RunPodAPI();
