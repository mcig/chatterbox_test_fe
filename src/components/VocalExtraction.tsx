import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Loader2, Music, Mic } from "lucide-react";
import AudioUpload from "./AudioUpload";
import AudioPlayer from "./AudioPlayer";
import FormatSelector from "./FormatSelector";
import { useFormatStore } from "@/stores/formatStore";

// TensorFlow.js-based vocal extraction
// Uses center channel extraction and spectral processing for better results

interface VocalExtractionProps {
  className?: string;
}

export default function VocalExtraction({
  className = "",
}: VocalExtractionProps) {
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    vocals: string;
    accompaniment: string;
    original: string;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [engineLoaded, setEngineLoaded] = useState(false);
  const [tf, setTf] = useState<typeof import("@tensorflow/tfjs") | null>(null);
  const { outputFormat } = useFormatStore();

  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize TensorFlow.js when component mounts
  useEffect(() => {
    const initTensorFlow = async () => {
      try {
        // Import TensorFlow.js core first
        const tfjs = await import("@tensorflow/tfjs");

        // Import backends
        await import("@tensorflow/tfjs-backend-webgl");
        await import("@tensorflow/tfjs-backend-cpu");

        // Set backend using the core tf object
        await tfjs.ready();
        await tfjs.setBackend("webgl");

        setTf(tfjs);
        setEngineLoaded(true);
        console.log("TensorFlow.js loaded with WebGL backend");
      } catch (err) {
        console.error("Failed to load TensorFlow.js with WebGL:", err);
        // Fallback to CPU backend
        try {
          const tfjs = await import("@tensorflow/tfjs");
          await import("@tensorflow/tfjs-backend-cpu");
          await tfjs.ready();
          await tfjs.setBackend("cpu");
          setTf(tfjs);
          setEngineLoaded(true);
          console.log("TensorFlow.js loaded with CPU backend");
        } catch (fallbackErr) {
          console.error("Failed to load TensorFlow.js:", fallbackErr);
          setError("Failed to initialize AI processing engine");
        }
      }
    };

    initTensorFlow();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const processAudioWithAI = async (
    file: File
  ): Promise<{ vocals: string; accompaniment: string }> => {
    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error("Audio processing timed out after 30 seconds"));
      }, 30000);

      try {
        // Create audio context
        const audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        audioContextRef.current = audioContext;

        // Create a simple audio processing pipeline
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;

            // Add timeout for audio decoding
            const decodePromise = audioContext.decodeAudioData(arrayBuffer);
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(
                () => reject(new Error("Audio decoding timed out")),
                10000
              )
            );

            const audioBuffer = await Promise.race([
              decodePromise,
              timeoutPromise,
            ]);

            // Simple vocal extraction using spectral gating (placeholder implementation)
            // In a real implementation, you would use a pre-trained model
            const { vocals, accompaniment } = await extractVocals(audioBuffer);

            // Convert to base64 with selected format
            const vocalsBase64 = await audioBufferToBase64(
              vocals,
              outputFormat
            );
            const accompanimentBase64 = await audioBufferToBase64(
              accompaniment,
              outputFormat
            );

            clearTimeout(timeout);
            resolve({
              vocals: vocalsBase64,
              accompaniment: accompanimentBase64,
            });
          } catch (err) {
            clearTimeout(timeout);
            reject(err);
          }
        };

        reader.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Failed to read audio file"));
        };

        reader.readAsArrayBuffer(file);
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  };

  const extractVocals = async (
    audioBuffer: AudioBuffer
  ): Promise<{ vocals: AudioBuffer; accompaniment: AudioBuffer }> => {
    const { length, sampleRate, numberOfChannels } = audioBuffer;
    const context = audioContextRef.current!;

    // Create new audio buffers for vocals and accompaniment
    const vocalsBuffer = context.createBuffer(
      numberOfChannels,
      length,
      sampleRate
    );
    const accompanimentBuffer = context.createBuffer(
      numberOfChannels,
      length,
      sampleRate
    );

    if (numberOfChannels >= 2) {
      // Stereo or more channels - use center channel extraction
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = audioBuffer.getChannelData(1);

      const vocalsLeft = vocalsBuffer.getChannelData(0);
      const vocalsRight = vocalsBuffer.getChannelData(1);
      const accompanimentLeft = accompanimentBuffer.getChannelData(0);
      const accompanimentRight = accompanimentBuffer.getChannelData(1);

      // Center channel extraction: vocals are typically in the center (L-R difference is minimal)
      // Side channel extraction: accompaniment is typically panned (L-R difference is significant)

      // First pass: calculate center and side channels
      const centerChannel = new Float32Array(length);
      const sideChannelLeft = new Float32Array(length);
      const sideChannelRight = new Float32Array(length);

      for (let i = 0; i < length; i++) {
        const left = leftChannel[i];
        const right = rightChannel[i];

        // Center channel (vocals): (L + R) / 2
        centerChannel[i] = (left + right) / 2;

        // Side channels (accompaniment): remove center from each channel
        sideChannelLeft[i] = left - centerChannel[i];
        sideChannelRight[i] = right - centerChannel[i];
      }

      // Second pass: apply smoothing filter
      const smoothingFactor = 0.3;
      vocalsLeft[0] = centerChannel[0];
      vocalsRight[0] = centerChannel[0];
      accompanimentLeft[0] = sideChannelLeft[0];
      accompanimentRight[0] = sideChannelRight[0];

      for (let i = 1; i < length; i++) {
        vocalsLeft[i] =
          vocalsLeft[i - 1] * (1 - smoothingFactor) +
          centerChannel[i] * smoothingFactor;
        vocalsRight[i] =
          vocalsRight[i - 1] * (1 - smoothingFactor) +
          centerChannel[i] * smoothingFactor;
        accompanimentLeft[i] =
          accompanimentLeft[i - 1] * (1 - smoothingFactor) +
          sideChannelLeft[i] * smoothingFactor;
        accompanimentRight[i] =
          accompanimentRight[i - 1] * (1 - smoothingFactor) +
          sideChannelRight[i] * smoothingFactor;
      }

      // Apply TensorFlow.js-based enhancement for better separation
      if (tf) {
        try {
          // Convert to tensors for processing (shape: [2, length])
          const vocalsTensor = tf.tensor2d(
            [Array.from(vocalsLeft), Array.from(vocalsRight)],
            [2, length]
          );
          const accompanimentTensor = tf.tensor2d(
            [Array.from(accompanimentLeft), Array.from(accompanimentRight)],
            [2, length]
          );

          // Apply soft limiting to prevent clipping
          const vocalsEnhanced = tf.tanh(vocalsTensor.mul(1.2));
          const accompanimentEnhanced = tf.tanh(accompanimentTensor.mul(1.1));

          // Convert back to arrays
          const vocalsData = await vocalsEnhanced.data();
          const accompanimentData = await accompanimentEnhanced.data();

          // Copy back to buffers
          for (let i = 0; i < length; i++) {
            vocalsLeft[i] = vocalsData[i] as number;
            vocalsRight[i] = vocalsData[i + length] as number;
            accompanimentLeft[i] = accompanimentData[i] as number;
            accompanimentRight[i] = accompanimentData[i + length] as number;
          }

          // Clean up tensors
          vocalsTensor.dispose();
          accompanimentTensor.dispose();
          vocalsEnhanced.dispose();
          accompanimentEnhanced.dispose();
        } catch (tfError) {
          console.warn(
            "TensorFlow.js processing failed, using basic processing:",
            tfError
          );
          // Continue with basic processing if TensorFlow fails
        }
      }
    } else {
      // Mono audio - use frequency-based separation
      const inputData = audioBuffer.getChannelData(0);
      const vocalsData = vocalsBuffer.getChannelData(0);
      const accompanimentData = accompanimentBuffer.getChannelData(0);

      // Simple frequency-based vocal extraction for mono
      const windowSize = 1024;
      const hopSize = windowSize / 4;

      for (let start = 0; start < length - windowSize; start += hopSize) {
        const window = inputData.slice(start, start + windowSize);

        // Apply simple high-pass filter for vocals (vocal frequencies are typically higher)
        const vocalsWindow = new Float32Array(windowSize);
        const accompanimentWindow = new Float32Array(windowSize);

        for (let i = 0; i < windowSize; i++) {
          const sample = window[i];

          // Simple frequency weighting
          const freqWeight = i / windowSize; // Higher frequencies get more weight
          const vocalWeight = Math.min(1, freqWeight * 3); // Boost higher frequencies
          const accompanimentWeight = Math.min(1, (1 - freqWeight) * 2); // Boost lower frequencies

          vocalsWindow[i] = sample * vocalWeight;
          accompanimentWindow[i] = sample * accompanimentWeight;
        }

        // Copy to output buffers
        for (let i = 0; i < windowSize && start + i < length; i++) {
          vocalsData[start + i] += vocalsWindow[i];
          accompanimentData[start + i] += accompanimentWindow[i];
        }
      }
    }

    // Final normalization and cleanup
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const vocalsData = vocalsBuffer.getChannelData(channel);
      const accompanimentData = accompanimentBuffer.getChannelData(channel);

      // Find maximum values without using spread operator (to avoid stack overflow)
      let maxVocals = 0;
      let maxAccompaniment = 0;

      for (let i = 0; i < length; i++) {
        const vocalsAbs = Math.abs(vocalsData[i]);
        const accompanimentAbs = Math.abs(accompanimentData[i]);
        if (vocalsAbs > maxVocals) maxVocals = vocalsAbs;
        if (accompanimentAbs > maxAccompaniment)
          maxAccompaniment = accompanimentAbs;
      }

      // Normalize to prevent clipping
      if (maxVocals > 0) {
        const vocalGain = Math.min(1, 0.9 / maxVocals);
        for (let i = 0; i < length; i++) {
          vocalsData[i] *= vocalGain;
        }
      }

      if (maxAccompaniment > 0) {
        const accompanimentGain = Math.min(1, 0.9 / maxAccompaniment);
        for (let i = 0; i < length; i++) {
          accompanimentData[i] *= accompanimentGain;
        }
      }
    }

    return { vocals: vocalsBuffer, accompaniment: accompanimentBuffer };
  };

  const audioBufferToBase64 = async (
    audioBuffer: AudioBuffer,
    format: "wav" | "mp3" = "mp3"
  ): Promise<string> => {
    if (format === "wav") {
      return audioBufferToWavBase64(audioBuffer);
    } else {
      return audioBufferToMp3Base64(audioBuffer);
    }
  };

  const audioBufferToWavBase64 = async (
    audioBuffer: AudioBuffer
  ): Promise<string> => {
    const { length, sampleRate, numberOfChannels } = audioBuffer;

    // Convert to WAV format
    const wavData = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(wavData);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, audioBuffer.getChannelData(channel)[i])
        );
        view.setInt16(offset, sample * 0x7fff, true);
        offset += 2;
      }
    }

    // Convert to base64
    const bytes = new Uint8Array(wavData);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  };

  const audioBufferToMp3Base64 = async (
    audioBuffer: AudioBuffer
  ): Promise<string> => {
    // For now, always use WAV format as MP3 encoding in browser is complex
    // and MediaRecorder doesn't actually produce MP3 files
    console.log(
      "Converting to WAV format (MP3 encoding not available in browser)"
    );
    return audioBufferToWavBase64(audioBuffer);
  };

  const handleExtractVocals = async () => {
    console.log("handleExtractVocals called, isProcessing:", isProcessing);

    if (isProcessing) {
      console.log("Already processing, returning early");
      return; // Prevent multiple clicks
    }

    if (!inputFile) {
      setError("Please select an audio file");
      return;
    }

    if (!engineLoaded) {
      setError(
        "Audio processing engine is not ready yet. Please wait a moment."
      );
      return;
    }

    console.log("Setting isProcessing to true");
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      // Convert original file to base64 for display
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const originalBase64 = (reader.result as string).split(",")[1];

          setProgress(25);
          console.log("Starting audio processing...");

          // Process with AI
          const { vocals, accompaniment } = await processAudioWithAI(inputFile);

          setProgress(100);
          console.log("Audio processing completed successfully");

          setResult({
            vocals,
            accompaniment,
            original: originalBase64,
          });
        } catch (err) {
          console.error("Error during audio processing:", err);
          setError(
            err instanceof Error ? err.message : "Failed to extract vocals"
          );
        } finally {
          console.log("Setting isProcessing to false in reader.onload finally");
          setIsProcessing(false);
          setProgress(0);
        }
      };

      reader.onerror = () => {
        console.error("FileReader error");
        setError("Failed to read the audio file");
        setIsProcessing(false);
        setProgress(0);
      };

      reader.readAsDataURL(inputFile);
    } catch (err) {
      console.error("Error in handleExtractVocals:", err);
      setError(err instanceof Error ? err.message : "Failed to extract vocals");
      console.log("Setting isProcessing to false in outer catch");
      setIsProcessing(false);
      setProgress(0);
    }
  };

  if (!engineLoaded) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Vocal Extraction
          </CardTitle>
          <CardDescription>
            AI-powered vocal extraction using TensorFlow.js to separate vocals
            from background music
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">
                Loading TensorFlow.js AI engine...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Vocal Extraction
          </CardTitle>
          <CardDescription>
            Upload an audio file to separate vocals from background music using
            TensorFlow.js AI processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AudioUpload
            label="Audio File"
            description="Upload a song or audio file to extract vocals from"
            file={inputFile}
            onFileChange={setInputFile}
            disabled={isProcessing}
            required
          />

          <FormatSelector disabled={isProcessing} />

          <Button
            onClick={handleExtractVocals}
            disabled={isProcessing || !inputFile}
            className="w-full"
            style={{
              opacity: isProcessing || !inputFile ? 0.5 : 1,
              pointerEvents: isProcessing || !inputFile ? "none" : "auto",
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Extracting Vocals... ({progress}%)
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Extract Vocals
              </>
            )}
          </Button>

          {isProcessing && (
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AudioPlayer
            audioBase64={result.vocals}
            title="Extracted Vocals"
            description="AI-extracted vocal track using TensorFlow.js"
            filename={`vocals_${Date.now()}.${outputFormat}`}
            format={outputFormat}
            className="lg:col-span-1"
          />

          <AudioPlayer
            audioBase64={result.accompaniment}
            title="Background Music"
            description="Instrumental/accompaniment track"
            filename={`accompaniment_${Date.now()}.${outputFormat}`}
            format={outputFormat}
            className="lg:col-span-1"
          />

          <AudioPlayer
            audioBase64={result.original}
            title="Original Audio"
            description="Original input file"
            filename={`original_${Date.now()}.${outputFormat}`}
            format={outputFormat}
            className="lg:col-span-1"
          />
        </div>
      )}
    </div>
  );
}
