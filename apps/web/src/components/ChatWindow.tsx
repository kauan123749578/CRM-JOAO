import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../api';

type Props = {
  chatName: string | null;
  messages: Message[];
  onSendMessage: (text: string, file?: File) => void;
  isLoading: boolean;
  onToggleSidebar: () => void;
  showSidebar: boolean;
  profilePicUrl?: string | null;
};

export default function ChatWindow({ chatName, messages, onSendMessage, isLoading, onToggleSidebar, showSidebar, profilePicUrl }: Props) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      onSendMessage(message.trim(), selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Opcional: mostrar preview
    }
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(msg.ts);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  if (!chatName) {
    return (
      <div className="flex-1 flex flex-col bg-zinc-950 items-center justify-center text-zinc-500">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg">Selecione uma conversa para iniciar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      {/* Background Decorativo Sutil */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-yellow-500/5 blur-[120px] -z-10 pointer-events-none"></div>

      <div className="h-20 px-8 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/80 backdrop-blur-xl shadow-2xl relative z-20">
        <div className="flex items-center gap-5">
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt={chatName || ''}
              className="w-14 h-14 rounded-2xl object-cover border border-zinc-800 shadow-2xl"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const fallback = img.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
              crossOrigin="anonymous"
            />
          ) : null}
          <div
            className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-black text-xl shadow-2xl"
            style={{ display: profilePicUrl ? 'none' : 'flex' }}
          >
            <span className="text-yellow-500 italic">
              {chatName?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <h3 className="text-white font-black text-lg leading-none uppercase tracking-tight italic">
              {chatName}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                Atendimento Ativo
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex gap-2 items-center px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800">
             <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
             </svg>
             <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">WhatsApp Direct</span>
          </div>
          <button onClick={onToggleSidebar} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 transition-all group" title="Info">
            <svg className="w-5 h-5 text-zinc-500 group-hover:text-yellow-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="animate-pulse">
                  <div
                    className={`h-16 ${i % 2 === 0 ? 'bg-yellow-400/20' : 'bg-zinc-800'} rounded-2xl`}
                    style={{ width: `${150 + Math.random() * 120}px` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedMessages).length > 0 ? (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex justify-center mb-4">
                <span className="bg-zinc-900 text-zinc-400 text-xs px-3 py-1 rounded-full">{date}</span>
              </div>
              {msgs.map((msg) => (
                <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div
                    className={`
                      max-w-[70%] px-4 py-3 rounded-2xl text-sm
                      ${msg.fromMe ? 'bg-yellow-400 text-black rounded-tr-none' : 'bg-zinc-900 text-white rounded-tl-none border border-zinc-800'}
                    `}
                  >
                    {/* Preview de mídia */}
                    {msg.hasMedia && msg.mediaType?.startsWith('image/') && (
                      <div className="mb-2 rounded-lg overflow-hidden bg-zinc-900/50 p-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-zinc-400">Imagem enviada</span>
                      </div>
                    )}
                    {msg.hasMedia && msg.mediaType?.startsWith('video/') && (
                      <div className="mb-2 rounded-lg overflow-hidden bg-zinc-900/50 p-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-zinc-400">Vídeo enviado</span>
                      </div>
                    )}
                    {msg.hasMedia && !msg.mediaType?.startsWith('image/') && !msg.mediaType?.startsWith('video/') && (
                      <div className="mb-2 rounded-lg overflow-hidden bg-zinc-900/50 p-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs text-zinc-400">Arquivo enviado</span>
                      </div>
                    )}
                    <p>{msg.body || (msg.hasMedia ? '[Mídia]' : '')}</p>
                    <span
                      className={`
                        text-[10px] mt-1 block text-right
                        ${msg.fromMe ? 'text-black/60' : 'text-zinc-500'}
                      `}
                    >
                      {formatTime(msg.ts)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500">
            <p>Nenhuma mensagem</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-5 bg-zinc-900/80 backdrop-blur-sm border-t border-zinc-800/50 shadow-lg">
        {selectedFile && (
          <div className="mb-3 p-3 bg-zinc-800/80 rounded-xl flex items-center justify-between text-sm border border-zinc-700 shadow-md">
            <span className="text-zinc-300 truncate flex-1 font-medium">{selectedFile.name}</span>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="ml-2 text-zinc-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        <div className="bg-zinc-950/80 rounded-2xl flex items-end p-3 border border-zinc-800/50 focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/20 transition-all duration-200 shadow-lg">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-zinc-400 hover:text-white transition-colors"
            title="Anexar arquivo"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-transparent text-white placeholder-zinc-500 p-3 h-12 max-h-32 resize-none focus:outline-none"
            rows={1}
          />

          {message.trim() ? (
            <button
              onClick={handleSend}
              className="p-3 bg-yellow-400 text-black rounded-xl hover:bg-yellow-300 transition-colors font-semibold"
            >
              Enviar
            </button>
          ) : (
            <button
              className="p-3 text-zinc-400 hover:text-white transition-colors"
              title="Gravar áudio"
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
