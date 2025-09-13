import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, Volume2, Loader2 } from "lucide-react";
import { runPodAPI } from "@/services/api";

interface AudioPlayerProps {
  audioBase64: string;
  title?: string;
  description?: string;
  filename?: string;
  sampleRate?: number;
  modelType?: string;
  languageId?: string;
  voiceCloned?: boolean;
  className?: string;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
];

export default function AudioPlayer({
  audioBase64,
  title = "Generated Audio",
  description,
  filename,
  sampleRate,
  modelType,
  languageId,
  voiceCloned,
  className = "",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Create audio URL from base64
  useEffect(() => {
    if (audioBase64) {
      const blob = runPodAPI.createAudioBlob(audioBase64);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBase64]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    if (!audioRef.current || !audioUrl) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  const handleDownload = () => {
    if (audioBase64) {
      runPodAPI.downloadAudio(audioBase64, filename);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getLanguageName = (code: string): string => {
    return LANGUAGES.find((lang) => lang.code === code)?.name || code;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription className="space-y-1">
          {description && <div>{description}</div>}
          <div className="flex flex-wrap gap-2">
            {voiceCloned && (
              <Badge variant="secondary" className="text-xs">
                Voice Cloned
              </Badge>
            )}
            {languageId && (
              <Badge variant="outline" className="text-xs">
                {getLanguageName(languageId)}
              </Badge>
            )}
            {modelType && (
              <Badge variant="outline" className="text-xs">
                {modelType}
              </Badge>
            )}
            {sampleRate && (
              <Badge variant="outline" className="text-xs">
                {sampleRate}Hz
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio Controls */}
        <div className="flex items-center gap-4">
          <Button
            onClick={togglePlayPause}
            disabled={!audioUrl || isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isLoading ? "Loading..." : isPlaying ? "Pause" : "Play"}
          </Button>

          <Button
            onClick={handleDownload}
            disabled={!audioBase64}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>

          {/* Time Display */}
          {duration > 0 && (
            <div className="text-sm text-muted-foreground ml-auto">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {duration > 0 && (
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          preload="metadata"
          className="hidden"
        />

        {/* Native Audio Controls (Fallback) */}
        {audioUrl && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Or use native controls:
            </p>
            <audio
              src={audioUrl}
              controls
              className="w-full"
              preload="metadata"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
