import { Label } from "@/components/ui/label";
import { useFormatStore } from "@/stores/formatStore";

interface FormatSelectorProps {
  disabled?: boolean;
  className?: string;
}

export default function FormatSelector({
  disabled = false,
  className = "",
}: FormatSelectorProps) {
  const { outputFormat, setOutputFormat } = useFormatStore();

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="output-format">Output Format</Label>
      <select
        id="output-format"
        value={outputFormat}
        onChange={(e) => setOutputFormat(e.target.value as "mp3" | "wav")}
        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
        disabled={disabled}
      >
        <option value="wav">WAV (Uncompressed - Higher quality)</option>
        <option value="mp3">MP3 (Compressed - Smaller files)</option>
      </select>
      <p className="text-xs text-muted-foreground">
        {outputFormat === "wav"
          ? "WAV format provides lossless quality but larger files"
          : "MP3 format provides compressed audio with smaller file sizes"}
      </p>
    </div>
  );
}
