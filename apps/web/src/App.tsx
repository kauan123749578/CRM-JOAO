import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import type { Chat, Message } from './api';
import { fetchChats, fetchMessages, sendMessage, updateChatTags, updateChatStage, getCurrentUser } from './api';
import ChannelSwitcher from './components/ChannelSwitcher';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import RightSidebar from './components/RightSidebar';
import MetricsPanel from './components/MetricsPanel';
import Login from './components/Login';

type StatusPayload = {
  instanceId: string;
  status: string;
  message?: string;
};

type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    // Inicializar com dados salvos
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeChannel, setActiveChannel] = useState('wa1');
  const [instanceId, setInstanceId] = useState('wa1');
  const [status, setStatus] = useState<StatusPayload>({ instanceId: 'wa1', status: 'idle' });
  const [qr, setQr] = useState<string | null>(null);
  const [qrImg, setQrImg] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const retryTimer = useRef<number | null>(null);
  
  // Cache de dados por instância (preserva chats e mensagens ao trocar de instância)
  const instanceCacheRef = useRef<Record<string, {
    chats: Chat[];
    messages: Record<string, Message[]>; // chatId -> messages
    selectedChatId: string | null;
  }>>({});
  
  // Refs para acessar valores atuais dos estados
  const chatsRef = useRef<Chat[]>([]);
  const selectedChatIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>([]);

  // Verificar autenticação ao carregar (só uma vez)
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      
      if (savedUser && savedToken) {
        try {
          // Tentar validar com backend
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setToken(savedToken);
            return;
          }
        } catch (e) {
          // Se falhar (modo dev ou token expirado), usar dados salvos
          try {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setToken(savedToken);
            return;
          } catch {
            // Ignore parse error
          }
        }
      }
      // Se não autenticado, limpar
      if (!savedUser || !savedToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    };
    void checkAuth();
  }, []); // Executar apenas uma vez ao montar

  const handleLogin = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const connect = () => {
    socketRef.current?.emit('wa:connect', { instanceId });
    setStatus({ instanceId, status: 'connecting', message: 'Inicializando...' });
  };

  const loadChats = async (id: string, force = false) => {
    if (loadingChats && !force) return;
    setLoadingChats(true);
    setChatError(null);
    try {
      const data = await fetchChats(id);
      if (data === null) {
        if (!retryTimer.current) {
          retryTimer.current = window.setTimeout(() => {
            retryTimer.current = null;
            void loadChats(id);
          }, 3000);
        }
        return;
      }
      setChats(data);
      chatsRef.current = data; // Atualizar ref
      // Salvar no cache
      if (!instanceCacheRef.current[id]) {
        instanceCacheRef.current[id] = { chats: [], messages: {}, selectedChatId: null };
      }
      instanceCacheRef.current[id].chats = data;
      // Restaurar chat selecionado e mensagens do cache se não houver selecionado
      if (!selectedChatIdRef.current) {
        const cachedSelected = instanceCacheRef.current[id].selectedChatId;
        if (cachedSelected && data.some(c => c.id === cachedSelected)) {
          const newSelectedId = cachedSelected;
          setSelectedChatId(newSelectedId);
          selectedChatIdRef.current = newSelectedId;
          // Restaurar mensagens do cache também
          if (instanceCacheRef.current[id].messages[newSelectedId]) {
            setMessages(instanceCacheRef.current[id].messages[newSelectedId]);
            messagesRef.current = instanceCacheRef.current[id].messages[newSelectedId];
          }
        } else if (data.length) {
          const newSelectedId = data[0].id;
          setSelectedChatId(newSelectedId);
          selectedChatIdRef.current = newSelectedId;
        }
      } else {
        // Se já tem chat selecionado, restaurar mensagens do cache se existirem
        const currentSelected = selectedChatIdRef.current;
        if (currentSelected && instanceCacheRef.current[id].messages[currentSelected]) {
          setMessages(instanceCacheRef.current[id].messages[currentSelected]);
          messagesRef.current = instanceCacheRef.current[id].messages[currentSelected];
        }
      }
    } catch (e: any) {
      setChatError(String(e?.message || e));
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMsgs = async (chatId: string) => {
    setLoadingMsgs(true);
    try {
      // Carregar mais mensagens (1000 para garantir que carrega todas)
      const data = await fetchMessages(instanceId, chatId, 1000);
      setMessages(data);
      messagesRef.current = data; // Atualizar ref
      // Salvar no cache
      if (!instanceCacheRef.current[instanceId]) {
        instanceCacheRef.current[instanceId] = { chats: [], messages: {}, selectedChatId: null };
      }
      instanceCacheRef.current[instanceId].messages[chatId] = data;
      return data;
    } finally {
      setLoadingMsgs(false);
    }
  };

  // Hooks devem ser chamados antes de qualquer return condicional
  useEffect(() => {
    if (!user || !token) return; // Sair se não autenticado
    
    const s = io({
      transports: ['polling', 'websocket'],
      reconnection: true
    });
    socketRef.current = s;

    s.on('connect', () => console.log('socket connected', s.id));

    s.on('wa:qr', (p: { instanceId: string; qr: string }) => {
      if (p.instanceId === instanceId) {
        setQr(p.qr);
      }
    });

    s.on('wa:status', (p: StatusPayload) => {
      if (p.instanceId === instanceId) {
        setStatus(p);
        if (p.status === 'ready') {
          // Carregar chats, mas preservar cache de mensagens
          void loadChats(instanceId, true).then(() => {
            // Após carregar chats, restaurar mensagens do cache se houver
            const cached = instanceCacheRef.current[instanceId];
            if (cached && cached.selectedChatId && cached.messages[cached.selectedChatId]) {
              // Aguardar um pouco para garantir que chats foram carregados
              setTimeout(() => {
                setMessages(cached.messages[cached.selectedChatId]);
                messagesRef.current = cached.messages[cached.selectedChatId];
                if (!selectedChatIdRef.current) {
                  setSelectedChatId(cached.selectedChatId);
                  selectedChatIdRef.current = cached.selectedChatId;
                }
              }, 500);
            }
          });
        }
      }
    });

    s.on('wa:message', (p: { instanceId: string; message: any }) => {
      if (p.instanceId === instanceId) {
        // Se for do chat selecionado, adicionar mensagem
        if (p.message?.chatId === selectedChatId) {
          setMessages((prev) => {
            // Evitar duplicatas
            if (prev.some((m) => m.id === p.message.id)) return prev;
            const newMessages = [
              ...prev,
              {
                id: p.message.id,
                chatId: p.message.chatId,
                body: p.message.body || '',
                fromMe: !!p.message.fromMe,
                ts: p.message.ts || 0,
                hasMedia: p.message.hasMedia || false,
                mediaType: p.message.mediaType || null
              }
            ];
            // Atualizar ref e cache também
            messagesRef.current = newMessages;
            if (instanceCacheRef.current[instanceId]) {
              instanceCacheRef.current[instanceId].messages[selectedChatId] = newMessages;
            }
            return newMessages;
          });
        }
        // Atualizar lista de chats automaticamente
        void loadChats(instanceId, true);
      }
    });

    // Listener para atualização de chat (mensagem nova, chat atualizado, etc)
    s.on('wa:chat_updated', (p: { instanceId: string; chatId: string; chat: any }) => {
      if (p.instanceId === instanceId) {
        // Atualizar chat na lista se existir
        setChats((prev) => {
          const existingIndex = prev.findIndex((c) => c.id === p.chatId);
          let updated: Chat[];
          
          if (existingIndex >= 0) {
            // Atualizar chat existente, mas PRESERVAR tags, stage e nome
            const existing = prev[existingIndex];
            updated = [...prev];
            
            // Lógica para preservar nome: se o nome novo for ID ou vazio, manter o existente
            const newName = p.chat.name;
            const shouldKeepExistingName = !newName || 
                                          newName === p.chatId || 
                                          newName.match(/^\d+@/) || 
                                          newName.length < 3;
            
            updated[existingIndex] = {
              ...existing, // Manter TODOS os dados existentes primeiro
              // Atualizar apenas campos que realmente mudam do WhatsApp
              unreadCount: p.chat.unreadCount !== undefined ? p.chat.unreadCount : existing.unreadCount,
              lastMessage: p.chat.lastMessage !== undefined ? p.chat.lastMessage : existing.lastMessage,
              lastTs: p.chat.lastTs !== undefined ? p.chat.lastTs : existing.lastTs,
              isGroup: p.chat.isGroup !== undefined ? p.chat.isGroup : existing.isGroup,
              // PRESERVAR tags e stage - NUNCA sobrescrever com undefined/null
              tags: Array.isArray(p.chat.tags) && p.chat.tags.length > 0 ? p.chat.tags : (existing.tags || []),
              stage: p.chat.stage || existing.stage || 'Entrada',
              // PRESERVAR nome - só atualizar se o novo for válido e diferente de ID
              name: shouldKeepExistingName ? existing.name : newName,
              // PRESERVAR profilePicUrl - só atualizar se vier um novo válido
              profilePicUrl: p.chat.profilePicUrl || existing.profilePicUrl || null
            };
            // Mover para o topo (última mensagem)
            const [moved] = updated.splice(existingIndex, 1);
            updated = [moved, ...updated];
          } else {
            // Novo chat, adicionar no início (garantir tags e stage padrão)
            // Verificar se nome é válido (não é ID)
            let chatName = p.chat.name;
            if (!chatName || chatName === p.chatId || chatName.match(/^\d+@/) || chatName.length < 3) {
              // Tentar extrair nome do ID ou usar número
              const idPart = p.chatId.split('@')[0];
              chatName = idPart.length <= 20 ? idPart : `${idPart.substring(0, 17)}...`;
            }
            
            updated = [{
              ...p.chat,
              name: chatName,
              tags: Array.isArray(p.chat.tags) ? p.chat.tags : [],
              stage: p.chat.stage || 'Entrada',
              profilePicUrl: p.chat.profilePicUrl || null
            }, ...prev];
          }
          
          // Atualizar ref e cache
          chatsRef.current = updated;
          if (instanceCacheRef.current[instanceId]) {
            instanceCacheRef.current[instanceId].chats = updated;
          }
          
          return updated;
        });
      }
    });

    return () => {
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
      s.disconnect();
    };
  }, [instanceId, selectedChatId, user, token]);

  useEffect(() => {
    if (!qr) {
      setQrImg(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(qr, { width: 260, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrImg(url);
      })
      .catch(() => {
        if (!cancelled) setQrImg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [qr]);

  useEffect(() => {
    const prevInstanceId = instanceId;
    
    // Salvar estado atual no cache antes de trocar (usar refs para valores atuais)
    if (prevInstanceId && prevInstanceId !== activeChannel) {
      if (!instanceCacheRef.current[prevInstanceId]) {
        instanceCacheRef.current[prevInstanceId] = { chats: [], messages: {}, selectedChatId: null };
      }
      instanceCacheRef.current[prevInstanceId].chats = chatsRef.current;
      instanceCacheRef.current[prevInstanceId].selectedChatId = selectedChatIdRef.current;
      if (selectedChatIdRef.current && messagesRef.current.length > 0) {
        instanceCacheRef.current[prevInstanceId].messages[selectedChatIdRef.current] = messagesRef.current;
      }
    }
    
    // Atualizar instância
    setInstanceId(activeChannel);
    setStatus({ instanceId: activeChannel, status: 'idle' });
    setQr(null);
    setQrImg(null);
    setSearchQuery('');
    // Preservar estado do sidebar ao trocar de instância (não fechar automaticamente)
    // setShowRightSidebar(false);
    setShowMetrics(false);
    
    // Restaurar estado do cache da nova instância IMEDIATAMENTE (sem delay)
    const cached = instanceCacheRef.current[activeChannel];
    if (cached && cached.chats.length > 0) {
      // Restaurar chats IMEDIATAMENTE
      setChats(cached.chats);
      chatsRef.current = cached.chats;
      
      // Restaurar chat selecionado e mensagens IMEDIATAMENTE
      if (cached.selectedChatId) {
        setSelectedChatId(cached.selectedChatId);
        selectedChatIdRef.current = cached.selectedChatId;
        
        // Restaurar mensagens do cache IMEDIATAMENTE se existirem
        if (cached.messages[cached.selectedChatId] && cached.messages[cached.selectedChatId].length > 0) {
          setMessages(cached.messages[cached.selectedChatId]);
          messagesRef.current = cached.messages[cached.selectedChatId];
          // Carregar novas mensagens em background (sem bloquear UI)
          void loadMsgs(cached.selectedChatId).then((newMessages) => {
            // Atualizar apenas se houver novas mensagens
            if (newMessages && newMessages.length > cached.messages[cached.selectedChatId].length) {
              setMessages(newMessages);
              messagesRef.current = newMessages;
              instanceCacheRef.current[activeChannel].messages[cached.selectedChatId] = newMessages;
            }
          });
        } else {
          // Se não tem no cache, carregar do servidor
          void loadMsgs(cached.selectedChatId);
        }
      } else if (cached.chats.length > 0) {
        // Selecionar primeiro chat se não tiver selecionado
        const firstChatId = cached.chats[0].id;
        setSelectedChatId(firstChatId);
        selectedChatIdRef.current = firstChatId;
        if (cached.messages[firstChatId] && cached.messages[firstChatId].length > 0) {
          setMessages(cached.messages[firstChatId]);
          messagesRef.current = cached.messages[firstChatId];
          // Carregar novas em background
          void loadMsgs(firstChatId).then((newMessages) => {
            if (newMessages && newMessages.length > cached.messages[firstChatId].length) {
              setMessages(newMessages);
              messagesRef.current = newMessages;
              instanceCacheRef.current[activeChannel].messages[firstChatId] = newMessages;
            }
          });
        } else {
          void loadMsgs(firstChatId);
        }
      } else {
        setMessages([]);
        messagesRef.current = [];
      }
    } else {
      // Nova instância sem cache - limpar tudo
      setChats([]);
      chatsRef.current = [];
      setSelectedChatId(null);
      selectedChatIdRef.current = null;
      setMessages([]);
      messagesRef.current = [];
      // Inicializar cache vazio
      if (!instanceCacheRef.current[activeChannel]) {
        instanceCacheRef.current[activeChannel] = { chats: [], messages: {}, selectedChatId: null };
      }
    }
  }, [activeChannel]);

  useEffect(() => {
    if (!user || !token || !selectedChatId) return;
    void loadMsgs(selectedChatId);
  }, [selectedChatId, instanceId, user, token]);

  const onSend = async (text: string, file?: File) => {
    if (!selectedChatId) return;
    try {
      await sendMessage(instanceId, selectedChatId, text, file);
      await loadMsgs(selectedChatId);
      // Lista de chats será atualizada automaticamente via Socket.IO
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleUpdateTags = async (tags: string[]) => {
    if (!selectedChatId) return;
    try {
      const updated = await updateChatTags(instanceId, selectedChatId, tags);
      setChats((prev) => prev.map((c) => {
        if (c.id === selectedChatId) {
          // NUNCA mudar o nome ao atualizar tags - sempre preservar o existente
          let finalName = c.name; // Sempre começar com o nome existente
          const updatedName = updated.name;
          const existingNameIsInvalid = !c.name || c.name === c.id || c.name.match(/^\d+@/) || c.name.length < 3;
          const updatedNameIsValid = updatedName && 
                                     updatedName !== updated.id && 
                                     !updatedName.match(/^\d+@/) && 
                                     updatedName.length >= 3;
          
          // Só mudar se o atual for inválido E o novo for válido
          if (existingNameIsInvalid && updatedNameIsValid) {
            finalName = updatedName;
          }
          
          return { 
            ...c, 
            tags: Array.isArray(updated.tags) ? updated.tags : (c.tags || []),
            stage: updated.stage || c.stage || 'Entrada',
            name: finalName // Sempre preservar nome existente
          };
        }
        return c;
      }));
      
      // Atualizar também o chat selecionado
      setSelectedChat((current) => {
        if (current && current.id === selectedChatId) {
          return { ...current, tags: Array.isArray(updated.tags) ? updated.tags : (current.tags || []) };
        }
        return current;
      });
    } catch (error) {
      console.error('Erro ao atualizar tags:', error);
    }
  };

  const handleUpdateStage = async (stage: string) => {
    if (!selectedChatId) return;
    try {
      const updated = await updateChatStage(instanceId, selectedChatId, stage);
      setChats((prev) => prev.map((c) => {
        if (c.id === selectedChatId) {
          // NUNCA mudar o nome ao atualizar stage - sempre preservar o existente
          let finalName = c.name;
          const updatedName = updated.name;
          const existingNameIsInvalid = !c.name || c.name === c.id || c.name.match(/^\d+@/) || c.name.length < 3;
          const updatedNameIsValid = updatedName && 
                                     updatedName !== updated.id && 
                                     !updatedName.match(/^\d+@/) && 
                                     updatedName.length >= 3;
          
          if (existingNameIsInvalid && updatedNameIsValid) {
            finalName = updatedName;
          }
          
          return { 
            ...c, 
            tags: updated.tags || c.tags || [],
            stage: updated.stage || c.stage || 'Entrada',
            name: finalName // Sempre preservar nome existente
          };
        }
        return c;
      }));
      
      // Atualizar também o chat selecionado
      setSelectedChat((current) => {
        if (current && current.id === selectedChatId) {
          return { ...current, stage: updated.stage || current.stage || 'Entrada' };
        }
        return current;
      });
    } catch (error) {
      console.error('Erro ao atualizar estágio:', error);
    }
  };

  // Se não está autenticado, mostrar tela de login (DEPOIS de todos os hooks)
  if (!user || !token) {
    return <Login onLogin={handleLogin} />;
  }

  const selectedChat = chats.find((c) => c.id === selectedChatId);

  const statusColor =
    status.status === 'ready'
      ? 'bg-green-500'
      : status.status === 'qr'
        ? 'bg-yellow-500'
        : status.status === 'authenticated'
          ? 'bg-blue-500'
          : status.status === 'error'
            ? 'bg-red-500'
            : 'bg-zinc-500';

  return (
    <div className="h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 flex">
      <ChannelSwitcher activeChannel={activeChannel} onSelectChannel={setActiveChannel} />

      <div className="flex-1 flex flex-col">
        <div className="h-24 flex items-center justify-between px-8 border-b border-zinc-900 bg-zinc-950 shadow-2xl relative z-30 overflow-hidden">
          {/* Luz de Fundo no Header */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-full bg-yellow-500/10 blur-[100px] pointer-events-none"></div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-2xl border border-zinc-800 backdrop-blur-md">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColor} shadow-[0_0_15px_rgba(34,197,94,0.4)] ${statusColor === 'bg-green-500' ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">{status.status}</span>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-yellow-500/5 hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Métricas
              </button>
            )}
            <div className="flex items-center gap-4 pl-6 border-l border-zinc-900">
              <div className="relative group">
                <div className="absolute inset-0 bg-yellow-500 rounded-xl blur opacity-20"></div>
                <div className="relative w-14 h-14 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-2xl group-hover:border-yellow-500/50 transition-all duration-500">
                  <svg className="w-9 h-9 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="font-black text-3xl text-white tracking-tighter leading-none italic uppercase">
                  JOÃO <span className="text-yellow-500">FORNECEDOR</span>
                </div>
                <div className="text-[11px] text-yellow-500/50 font-black tracking-[0.4em] uppercase mt-1.5 italic">EXCLUSIVO PARA PARCEIROS</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex flex-col items-end mr-2">
               <div className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1 italic">Operador Online</div>
               <div className="text-sm text-zinc-100 font-black uppercase italic tracking-tighter">
                  {user.name} <span className="text-yellow-500 ml-1">[{user.role === 'admin' ? 'BOSS' : 'STAFF'}]</span>
               </div>
            </div>

            <button
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:shadow-yellow-500/40 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed italic"
              onClick={connect}
              disabled={status.status === 'connecting' || status.status === 'qr'}
            >
              {status.status === 'connecting' || status.status === 'qr' ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sincronizando...
                </span>
              ) : (
                'Conectar'
              )}
            </button>
            <button
              className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl hover:shadow-zinc-800/40 hover:-translate-y-1 italic"
              onClick={() => void loadChats(instanceId, true)}
              title="Atualizar chats"
            >
              Atualizar chats
            </button>

            <div className="flex gap-2">
              <button
                className="p-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-2xl transition-all shadow-xl"
                onClick={() => void loadChats(instanceId, true)}
                title="Sincronizar"
              >
                 <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
              </button>
              <button
                className="px-6 py-3.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 italic shadow-xl"
                onClick={handleLogout}
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            <ChatList
            chats={chats}
            activeChatId={selectedChatId}
            onSelectChat={(id) => {
              setSelectedChatId(id);
              selectedChatIdRef.current = id;
              void loadMsgs(id);
            }}
            isLoading={loadingChats}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <div className="flex-1 flex">
            <ChatWindow
              chatName={selectedChat?.name || selectedChat?.id || null}
              messages={messages}
              onSendMessage={onSend}
              isLoading={loadingMsgs}
              onToggleSidebar={() => setShowRightSidebar(!showRightSidebar)}
              showSidebar={showRightSidebar}
              profilePicUrl={selectedChat?.profilePicUrl || null}
            />

            {showRightSidebar && selectedChat && user && (
              <RightSidebar
                chat={selectedChat}
                instanceId={instanceId}
                onClose={() => setShowRightSidebar(false)}
                onUpdateTags={handleUpdateTags}
                onUpdateStage={handleUpdateStage}
                userRole={user.role}
              />
            )}
            {showMetrics && user?.role === 'admin' && (
              <MetricsPanel onClose={() => setShowMetrics(false)} />
            )}
          </div>
        </div>

        {qr && status.status !== 'ready' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <div className="font-semibold mb-4 text-center text-white">Escaneie o QR Code</div>
              {qrImg ? (
                <div className="bg-white inline-block p-2 rounded">
                  <img src={qrImg} alt="QR Code" className="w-[260px] h-[260px]" />
                </div>
              ) : (
                <div className="text-xs break-all text-zinc-300">{qr}</div>
              )}
              <button
                onClick={() => setQr(null)}
                className="mt-4 w-full bg-zinc-800 text-white px-4 py-2 rounded hover:bg-zinc-700"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}