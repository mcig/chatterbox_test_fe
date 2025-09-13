import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Upload, X, FileAudio, AlertCircle } from 'lucide-react';

interface AudioUploadProps {
  label: string;
  description?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function AudioUpload({
  label,
  description,
  file,
  onFileChange,
  accept = "audio/*",
  disabled = false,
  required = false,
  className = ""
}: AudioUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): boolean => {
    // Check file type
    if (!selectedFile.type.startsWith('audio/')) {
      setError('Please upload an audio file');
      return false;
    }

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 50MB');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      onFileChange(selectedFile);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleButtonClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (file: File): string => {
    // This is a placeholder - in a real implementation, you'd need to
    // decode the audio file to get the actual duration
    return 'Unknown duration';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={`audio-upload-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        id={`audio-upload-${label.toLowerCase().replace(/\s+/g, '-')}`}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
          ${file ? 'border-primary bg-primary/5' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        {file ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <FileAudio className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">{file.name}</p>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {formatFileSize(file.size)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {file.type.split('/')[1].toUpperCase()}
                </Badge>
              </div>
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                className="text-destructive hover:text-destructive"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <Upload className={`w-8 h-8 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragOver ? 'Drop your audio file here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground">
                Audio files up to 50MB (MP3, WAV, M4A, etc.)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {/* File Info */}
      {file && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>File: {file.name}</p>
          <p>Size: {formatFileSize(file.size)}</p>
          <p>Type: {file.type}</p>
          <p>Last modified: {new Date(file.lastModified).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
