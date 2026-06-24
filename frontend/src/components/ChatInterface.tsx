import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Loader2 } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onReply: (text: string) => void;
  isLoading: boolean;
}

export default function ChatInterface({ messages, onReply, isLoading }: ChatInterfaceProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onReply(inputText.trim());
    setInputText('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col h-[60vh] bg-[var(--amazon-card)] border border-[var(--amazon-border-light)] rounded-2xl shadow-[var(--shadow-float)] overflow-hidden animate-fadeUp">
      {/* Header */}
      <div className="px-6 py-4 bg-black/5 dark:bg-black/20 border-b border-[var(--amazon-border-light)] flex items-center gap-3">
        <div className="bg-[var(--amazon-orange-dim)] p-2 rounded-full">
          <Bot size={20} className="text-[var(--amazon-orange)]" />
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-[var(--amazon-text)] leading-tight">Amazon Now Assistant</h2>
          <p className="text-[12px] text-[var(--amazon-muted)]">Building your cart step-by-step</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 hide-scrollbar relative">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full animate-fadeUp`}>
              <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full mt-1 ${isUser ? 'bg-[var(--amazon-navy)] border border-[var(--amazon-border)]' : 'bg-[var(--amazon-orange)]'}`}>
                  {isUser ? <User size={14} className="text-[var(--amazon-text-dim)]" /> : <Bot size={14} className="text-white" />}
                </div>

                {/* Bubble */}
                <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                  isUser 
                    ? 'bg-[var(--amazon-navy)] text-[var(--amazon-text)] border border-[var(--amazon-border)] rounded-tr-sm' 
                    : 'bg-black/5 dark:bg-white/10 text-[var(--amazon-text)] rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start w-full animate-fadeUp">
            <div className="flex gap-3 max-w-[85%]">
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full mt-1 bg-[var(--amazon-orange)]">
                <Bot size={14} className="text-white" />
              </div>
              <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-black/5 dark:bg-white/10 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[var(--amazon-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[var(--amazon-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[var(--amazon-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/5 dark:bg-black/20 border-t border-[var(--amazon-border-light)]">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your answer..."
            disabled={isLoading}
            className="w-full bg-[var(--amazon-card)] border border-[var(--amazon-border)] text-[var(--amazon-text)] rounded-full pl-5 pr-12 py-3.5 text-[14px] outline-none focus:border-[var(--amazon-orange)] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 p-2 bg-[var(--amazon-orange)] text-white rounded-full hover:bg-[var(--amazon-orange-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
