// frontend/src/components/IntentBar.tsx
// The primary input surface — text + camera (image) + mic (speech-to-text).
// Phase 5: Camera/mic are functional stubs — camera opens file picker,
// mic uses browser SpeechRecognition if available.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useCallback } from 'react';
import { Send, Camera, Mic, MicOff, X, Loader2 } from 'lucide-react';

interface IntentBarProps {
  onSubmit: (text: string, imageBase64?: string, isChatMode?: boolean) => void;
  isLoading: boolean;
}

export default function IntentBar({ onSubmit, isLoading }: IntentBarProps) {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Camera / image file picker ────────────────────────────────────────────
  const handleImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      // Compress image
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 1280;
        
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          } else {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImagePreview(compressedDataUrl);
        const base64 = compressedDataUrl.split(',')[1];
        setImageBase64(base64);
      };
      img.src = dataUrl;
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
    onSubmit(text.trim(), imageBase64 ?? undefined, isChatMode);
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
          <span className="intent-image-label">📷 Photo ready to analyze</span>
        </div>
      )}

      {/* Input row */}
      <div className="intent-input-row relative">
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

        <div className="intent-actions items-center">
          {/* Animated Pill Toggle */}
          <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-full p-1 relative cursor-pointer mr-2 shadow-inner h-8" onClick={() => setIsChatMode(!isChatMode)} title={isChatMode ? "Chat Mode: Stepwise questions" : "Quick Build: Direct cart"}>
            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[var(--amazon-orange)] rounded-full transition-transform duration-300 ease-out shadow-md ${isChatMode ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} />
            <div className={`flex-1 flex items-center justify-center px-3 z-10 text-[11px] font-black tracking-wider transition-colors duration-300 ${!isChatMode ? 'text-white drop-shadow-md' : 'text-[var(--amazon-muted)]'}`}>QUICK</div>
            <div className={`flex-1 flex items-center justify-center px-3 z-10 text-[11px] font-black tracking-wider transition-colors duration-300 ${isChatMode ? 'text-white drop-shadow-md' : 'text-[var(--amazon-muted)]'}`}>CHAT</div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
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
