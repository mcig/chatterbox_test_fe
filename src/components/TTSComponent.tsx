import { useState, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert } from "@/components/ui/alert";
import { Mic, Volume2, Languages, Music, Loader2 } from "lucide-react";
import AudioUpload from "./AudioUpload";
import AudioPlayer from "./AudioPlayer";
import { runPodAPI, TTSRequest, VoiceCloneRequest } from "@/services/api";

// Lazy load the vocal extraction component
const VocalExtraction = lazy(() => import("./VocalExtraction"));

interface TTSResponse {
  audio_base64?: string;
  error?: string;
  sample_rate?: number;
  format?: string;
  language_id?: string;
  model_type?: string;
  mode?: string;
  voice_cloned?: boolean;
}

const LANGUAGES = [
  { code: "tr", name: "Turkish" },
  { code: "en", name: "English" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
];

export default function TTSComponent() {
  const [text, setText] = useState("");
  const [languageId, setLanguageId] = useState("");
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [sourceAudio, setSourceAudio] = useState<File | null>(null);
  const [targetVoice, setTargetVoice] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TTSResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("tts");

  const handleTTS = async () => {
    if (!text.trim()) {
      setError("Please enter text to synthesize");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestData: TTSRequest = {
        mode: "tts",
        text: text.trim(),
        return_format: "base64",
      };

      // Add language if specified (for multilingual)
      if (languageId) {
        requestData.language_id = languageId;
      }

      // Add voice sample if provided
      if (voiceSample) {
        requestData.voice_sample_base64 = await runPodAPI.convertFileToBase64(
          voiceSample
        );
      }

      const response = await runPodAPI.generateTTS(requestData);

      if (response.error) {
        setError(response.error);
      } else {
        setResult(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceClone = async () => {
    if (!sourceAudio || !targetVoice) {
      setError("Please provide both source audio and target voice files");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestData: VoiceCloneRequest = {
        mode: "voice_clone",
        source_audio_base64: await runPodAPI.convertFileToBase64(sourceAudio),
        target_voice_base64: await runPodAPI.convertFileToBase64(targetVoice),
        return_format: "base64",
      };

      const response = await runPodAPI.cloneVoice(requestData);

      if (response.error) {
        setError(response.error);
      } else {
        setResult(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Volume2 className="w-8 h-8" />
          ChatterBox TTS & Voice Cloning
        </h1>
        <p className="text-muted-foreground">
          Transform text to speech, clone voices, and extract vocals with
          AI-powered technology
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tts" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Text to Speech
          </TabsTrigger>
          <TabsTrigger value="voice-clone" className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            Voice Cloning
          </TabsTrigger>
          <TabsTrigger
            value="vocal-extraction"
            className="flex items-center gap-2"
          >
            <Music className="w-4 h-4" />
            Vocal Extraction
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Text to Speech</CardTitle>
              <CardDescription>
                Generate speech from text with optional voice cloning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text">Text to synthesize</Label>
                <textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text you want to convert to speech..."
                  className="w-full min-h-[100px] p-3 border rounded-md resize-y"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">
                    Language (optional - defaults to English)
                  </Label>
                  <select
                    id="language"
                    value={languageId}
                    onChange={(e) => setLanguageId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    disabled={isLoading}
                  >
                    <option value="">Auto-detect / English</option>
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <AudioUpload
                  label="Voice Sample (optional)"
                  description="Upload a voice sample to clone for TTS generation"
                  file={voiceSample}
                  onFileChange={setVoiceSample}
                  disabled={isLoading}
                />
              </div>

              <Button
                onClick={handleTTS}
                disabled={isLoading || !text.trim()}
                className="w-full"
              >
                {isLoading ? "Generating..." : "Generate Speech"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice-clone" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice to Voice Cloning</CardTitle>
              <CardDescription>
                Clone a voice from one audio to another
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AudioUpload
                  label="Source Audio"
                  description="Audio file to clone voice from"
                  file={sourceAudio}
                  onFileChange={setSourceAudio}
                  disabled={isLoading}
                  required
                />

                <AudioUpload
                  label="Target Voice"
                  description="Voice sample to clone to the source audio"
                  file={targetVoice}
                  onFileChange={setTargetVoice}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button
                onClick={handleVoiceClone}
                disabled={isLoading || !sourceAudio || !targetVoice}
                className="w-full"
              >
                {isLoading ? "Cloning Voice..." : "Clone Voice"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vocal-extraction" className="space-y-4">
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Vocal Extraction
                  </CardTitle>
                  <CardDescription>
                    Loading TensorFlow.js AI vocal extraction engine...
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                    <p className="text-muted-foreground">
                      Loading components...
                    </p>
                  </div>
                </CardContent>
              </Card>
            }
          >
            <VocalExtraction />
          </Suspense>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      )}

      {result && result.audio_base64 && (
        <AudioPlayer
          audioBase64={result.audio_base64}
          title={
            result.voice_cloned ? "Voice Cloned Audio" : "Generated Speech"
          }
          description={
            result.voice_cloned
              ? "Audio with cloned voice"
              : "Text-to-speech generated audio"
          }
          sampleRate={result.sample_rate}
          modelType={result.model_type}
          languageId={result.language_id}
          voiceCloned={result.voice_cloned}
          filename={`${
            result.voice_cloned ? "voice_cloned" : "tts"
          }_${Date.now()}.wav`}
        />
      )}
    </div>
  );
}
