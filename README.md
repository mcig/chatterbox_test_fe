# ChatterBox TTS & Voice Cloning Frontend

A modern React frontend for the ChatterBox TTS and Voice Cloning system, built with TypeScript and Vite.

## Features

- **Text-to-Speech (TTS)**: Generate speech from text with support for 23+ languages
- **Voice Cloning**: Clone voices for TTS generation using voice samples
- **Voice-to-Voice Cloning**: Clone a voice from one audio file to another
- **Audio Player**: Built-in audio player with download functionality
- **Modern UI**: Clean, responsive interface built with Radix UI and Tailwind CSS

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure RunPod API**:
   Create a `.env` file in the root directory with your RunPod credentials:

   ```env
   VITE_RUNPOD_ENDPOINT=your-runpod-endpoint-id
   VITE_RUNPOD_API_KEY=your-runpod-api-key
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Usage

### Text-to-Speech

1. Enter text in the text area
2. Optionally select a language (defaults to English)
3. Optionally upload a voice sample for voice cloning
4. Click "Generate Speech"

### Voice Cloning

1. Upload a source audio file
2. Upload a target voice sample
3. Click "Clone Voice"

## API Integration

The frontend communicates directly with RunPod's API using the serverless handler. Make sure your RunPod endpoint is deployed and accessible.

## Technologies

- React 19 with TypeScript
- Vite for build tooling
- Radix UI for accessible components
- Tailwind CSS for styling
- Lucide React for icons
