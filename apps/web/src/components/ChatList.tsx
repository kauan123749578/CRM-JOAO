import React, { useState, useMemo } from 'react';
import type { Chat } from '../api';

type Props = {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
};

export default function ChatList({ chats, activeChatId, onSelectChat, isLoading, searchQuery, onSearchChange }: Props) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all');

  const filteredChats = useMemo(() => {
    let result = chats;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) => (c.name || c.id).toLowerCase().includes(query));
    }

    if (filter === 'unread') {
      result = result.filter((c) => c.unreadCount > 0);
    } else if (filter === 'groups') {
      result = result.filter((c) => c.isGroup);
    }

    return result;
  }, [chats, searchQuery, filter]);

  const formatTime = (ts: number) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Ontem';
    if (days < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const TAG_COLORS: Record<string, string> = {
    'Lead Quente': '#EF4444',
    'Negociação': '#F59E0B',
    'Frio': '#3B82F6',
    'Interno': '#6B7280',
    'Lead': '#FFD700'
  };

  const getTagColor = (tag: string) => TAG_COLORS[tag] || '#9CA3AF';

  return (
    <div className="w-[380px] bg-zinc-950 border-r border-zinc-900 flex flex-col h-full shadow-2xl relative z-20">
      <div className="p-6 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">
            CONTATOS <span className="text-yellow-500">VIP</span>
          </h2>
          <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute inset-0 bg-yellow-500/5 rounded-xl blur-lg group-focus-within:bg-yellow-500/10 transition-all"></div>
          <input
            type="text"
            placeholder="Buscar parceiro..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="relative w-full bg-zinc-900/50 text-white pl-11 pr-4 py-3.5 rounded-xl border border-zinc-800 focus:border-yellow-500/50 focus:outline-none focus:ring-4 focus:ring-yellow-500/5 text-sm transition-all duration-300 placeholder:text-zinc-600 font-medium"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-yellow-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="px-6 py-4 flex gap-2 text-[11px] border-b border-zinc-900 bg-zinc-950/30 uppercase tracking-[0.2em] font-black italic">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            filter === 'all' 
              ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            filter === 'unread' 
              ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)]' 
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          Novos
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-zinc-800 animate-pulse">
              <div className="flex justify-between items-start mb-2">
                <div className="h-4 bg-zinc-800 rounded w-32"></div>
                <div className="h-3 bg-zinc-800 rounded w-12"></div>
              </div>
              <div className="h-3 bg-zinc-800 rounded w-48"></div>
            </div>
          ))
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = activeChatId === chat.id;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`
                  px-6 py-5 cursor-pointer transition-all duration-300 border-b border-zinc-900 group
                  ${isActive 
                    ? 'bg-zinc-900 border-l-[6px] border-l-yellow-500 shadow-inner' 
                    : 'hover:bg-zinc-900/50 border-l-[6px] border-l-transparent hover:border-l-yellow-500/30'
                  }
                `}
              >
                <div className="flex gap-5">
                  <div className="flex-shrink-0 relative">
                    <div className={`absolute -inset-1 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isActive ? 'bg-yellow-500/20 opacity-100' : 'bg-white/5'}`}></div>
                    {chat.profilePicUrl ? (
                      <img
                        src={chat.profilePicUrl}
                        alt={chat.name || chat.id}
                        className="relative w-16 h-16 rounded-2xl object-cover border border-zinc-800 shadow-2xl group-hover:border-yellow-500/50 transition-colors"
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
                      className="relative w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-white font-black text-xl border border-zinc-800 shadow-2xl group-hover:border-yellow-500/50 transition-colors"
                      style={{ display: chat.profilePicUrl ? 'none' : 'flex' }}
                    >
                      <span className="text-yellow-500 italic">
                        {(chat.name || chat.id).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.5)] z-10 animate-bounce">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className={`font-black uppercase tracking-tight truncate text-sm transition-colors ${isActive ? 'text-yellow-500' : 'text-zinc-100 group-hover:text-white'}`}>
                        {chat.name || chat.id}
                      </div>
                      <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest pl-2">{formatTime(chat.lastTs)}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className={`text-xs truncate transition-colors ${isActive ? 'text-zinc-400' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                        {chat.lastMessage || 'Nenhuma mensagem'}
                      </div>
                    </div>

                    {chat.tags && chat.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-2.5 flex-wrap">
                        {chat.tags.slice(0, 2).map((tag, i) => {
                          const color = getTagColor(tag);
                          return (
                            <span
                              key={i}
                              className="text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter border"
                              style={{ 
                                backgroundColor: `${color}10`,
                                borderColor: `${color}30`,
                                color: color 
                              }}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


