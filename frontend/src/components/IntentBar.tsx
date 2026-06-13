// frontend/src/components/IntentBar.tsx
// The primary input surface — text + camera (image) + mic (speech-to-text).
// Phase 5: Camera/mic are functional stubs — camera opens file picker,
// mic uses browser SpeechRecognition if available.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useCallback } from 'react';
import { Send, Camera, Mic, MicOff, X, Loader2 } from 'lucide-react';

interface IntentBarProps {
  onSubmit: (text: string, imageBase64?: string) => void;
  isLoading: boolean;
}

export default function IntentBar({ onSubmit, isLoading }: IntentBarProps) {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Camera / image file picker ────────────────────────────────────────────
  const handleImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Strip the data:image/...;base64, prefix
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Mic / SpeechRecognition ───────────────────────────────────────────────
  const handleMicClick = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Try Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && !imageBase64) || isLoading) return;
    onSubmit(text.trim(), imageBase64 ?? undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSubmit = (text.trim().length > 0 || !!imageBase64) && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="intent-bar-wrapper">
      {/* Image preview */}
      {imagePreview && (
        <div className="intent-image-preview">
          <img src={imagePreview} alt="Attached" className="intent-preview-img" />
          <button
            type="button"
            className="intent-image-remove"
            onClick={removeImage}
            aria-label="Remove image"
          >
            <X size={14} />
          </button>
          <span className="intent-image-label">📷 Image attached</span>
        </div>
      )}

      {/* Input row */}
      <div className="intent-input-row">
        <textarea
          id="intent-input"
          className="intent-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            imageBase64
              ? 'Add a note (optional)… e.g. "for 2 people, budget ₹400"'
              : 'What do you need? e.g. "breakfast for 2 under ₹300" or "paneer butter masala for 4"'
          }
          rows={2}
          disabled={isLoading}
          aria-label="Shopping intent input"
        />

        <div className="intent-actions">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          {/* Camera button */}
          <button
            id="camera-btn"
            type="button"
            className={`intent-icon-btn ${imageBase64 ? 'active' : ''}`}
            onClick={handleCameraClick}
            title="Attach photo (fridge, list, product)"
            disabled={isLoading}
            aria-label="Attach photo"
          >
            <Camera size={20} />
          </button>

          {/* Mic button */}
          <button
            id="mic-btn"
            type="button"
            className={`intent-icon-btn ${isListening ? 'listening' : ''}`}
            onClick={handleMicClick}
            title="Voice input"
            disabled={isLoading}
            aria-label={isListening ? 'Stop recording' : 'Start voice input'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Send button */}
          <button
            id="send-btn"
            type="submit"
            className="intent-send-btn"
            disabled={!canSubmit}
            aria-label="Build cart"
          >
            {isLoading ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>

      {isListening && (
        <div className="intent-listening-badge">
          <span className="pulse-dot" /> Listening…
        </div>
      )}
    </form>
  );
}
