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
import {
  Mic,
  Volume2,
  Languages,
  Music,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import AudioUpload from "./AudioUpload";
import AudioPlayer from "./AudioPlayer";
import { runPodAPI, TTSRequest, VoiceCloneRequest } from "@/services/api";
import { useTTSStore } from "@/stores/ttsStore";
import { useJobPolling } from "@/hooks/useJobPolling";

// Lazy load the vocal extraction component
const VocalExtraction = lazy(() => import("./VocalExtraction"));

// Removed unused TTSResponse interface - using types from api.ts

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
  const [activeTab, setActiveTab] = useState("tts");

  // Zustand store
  const { currentJobId, startJob, setCurrentJob, getCurrentJob, isJobRunning } =
    useTTSStore();

  const currentJob = getCurrentJob();
  const { manualPoll } = useJobPolling(currentJobId);

  const handleTTS = async () => {
    if (!text.trim()) {
      return;
    }

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

      // Start async job
      const jobResponse = await runPodAPI.generateTTSAsync(requestData);

      // Create job in store
      startJob(jobResponse.id);
      setCurrentJob(jobResponse.id);
    } catch (err) {
      console.error("TTS Error:", err);
    }
  };

  const handleVoiceClone = async () => {
    if (!sourceAudio || !targetVoice) {
      return;
    }

    try {
      const requestData: VoiceCloneRequest = {
        mode: "voice_clone",
        source_audio_base64: await runPodAPI.convertFileToBase64(sourceAudio),
        target_voice_base64: await runPodAPI.convertFileToBase64(targetVoice),
        return_format: "base64",
      };

      // Start async job
      const jobResponse = await runPodAPI.cloneVoiceAsync(requestData);

      // Create job in store
      startJob(jobResponse.id);
      setCurrentJob(jobResponse.id);
    } catch (err) {
      console.error("Voice Clone Error:", err);
    }
  };

  const handleManualPoll = async () => {
    if (currentJobId) {
      try {
        await manualPoll();
      } catch (error) {
        console.error("Manual poll failed:", error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Queued";
      case "running":
        return "Processing";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Volume2 className="w-8 h-8" />
          m.cig TTS & Voice Cloning
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
                  disabled={isJobRunning(currentJobId || "")}
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
                    disabled={isJobRunning(currentJobId || "")}
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
                  disabled={isJobRunning(currentJobId || "")}
                />
              </div>

              <Button
                onClick={handleTTS}
                disabled={isJobRunning(currentJobId || "") || !text.trim()}
                className="w-full"
              >
                {isJobRunning(currentJobId || "")
                  ? "Generating..."
                  : "Generate Speech"}
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
                  disabled={isJobRunning(currentJobId || "")}
                  required
                />

                <AudioUpload
                  label="Target Voice"
                  description="Voice sample to clone to the source audio"
                  file={targetVoice}
                  onFileChange={setTargetVoice}
                  disabled={isJobRunning(currentJobId || "")}
                  required
                />
              </div>

              <Button
                onClick={handleVoiceClone}
                disabled={
                  isJobRunning(currentJobId || "") ||
                  !sourceAudio ||
                  !targetVoice
                }
                className="w-full"
              >
                {isJobRunning(currentJobId || "")
                  ? "Cloning Voice..."
                  : "Clone Voice"}
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

      {/* Job Status Display */}
      {currentJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(currentJob.status)}
                Job Status: {getStatusText(currentJob.status)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualPoll}
                disabled={
                  currentJob.status === "completed" ||
                  currentJob.status === "failed"
                }
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Job ID: {currentJob.id}
              {currentJob.updatedAt && (
                <span className="ml-2 text-xs">
                  Last updated: {currentJob.updatedAt.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentJob.error && (
              <Alert variant="destructive" className="mb-4">
                <p>{currentJob.error}</p>
              </Alert>
            )}
            {currentJob.result && currentJob.result.audio_base64 && (
              <AudioPlayer
                audioBase64={currentJob.result.audio_base64}
                title={
                  currentJob.result.voice_cloned
                    ? "Voice Cloned Audio"
                    : "Generated Speech"
                }
                description={
                  currentJob.result.voice_cloned
                    ? "Audio with cloned voice"
                    : `Generated speech${
                        currentJob.result.language_id
                          ? ` in ${currentJob.result.language_id}`
                          : ""
                      }`
                }
                sampleRate={currentJob.result.sample_rate}
                modelType={currentJob.result.model_type}
                languageId={currentJob.result.language_id}
                voiceCloned={currentJob.result.voice_cloned}
                filename={`${
                  currentJob.result.voice_cloned ? "voice_cloned" : "tts"
                }_${Date.now()}.wav`}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
