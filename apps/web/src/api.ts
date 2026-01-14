export type Chat = {
  id: string;
  name: string | null;
  isGroup: boolean;
  unreadCount: number;
  lastMessage: string | null;
  lastTs: number;
  tags?: string[];
  stage?: string;
  profilePicUrl?: string | null;
};

export type Message = {
  id: string;
  chatId: string;
  body: string | null;
  fromMe: boolean;
  ts: number;
  hasMedia?: boolean;
  mediaType?: string;
};

function baseUrl() {
  return '';
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function fetchChats(instanceId: string): Promise<Chat[] | null> {
  const res = await fetch(`${baseUrl()}/api/instances/${encodeURIComponent(instanceId)}/chats`, {
    headers: getAuthHeaders()
  });
  if (res.status === 503) return null;
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    return null;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Chat[];
}

export async function fetchMessages(instanceId: string, chatId: string, limit = 50): Promise<Message[]> {
  const res = await fetch(
    `${baseUrl()}/api/instances/${encodeURIComponent(instanceId)}/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}`,
    { headers: getAuthHeaders() }
  );
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    throw new Error('Não autenticado');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Message[];
}

export async function sendMessage(instanceId: string, chatId: string, text: string, mediaFile?: File) {
  if (mediaFile) {
    // Enviar com mídia usando FormData
    const formData = new FormData();
    formData.append('file', mediaFile);
    formData.append('chatId', chatId);
    if (text) formData.append('text', text);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl()}/api/instances/${encodeURIComponent(instanceId)}/send-media`, {
      method: 'POST',
      headers,
      body: formData
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
      throw new Error('Não autenticado');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } else {
    // Enviar apenas texto
    const res = await fetch(`${baseUrl()}/api/instances/${encodeURIComponent(instanceId)}/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ chatId, text })
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
      throw new Error('Não autenticado');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
}

export async function updateChatTags(instanceId: string, chatId: string, tags: string[]): Promise<Chat> {
  const res = await fetch(
    `${baseUrl()}/api/instances/${encodeURIComponent(instanceId)}/chats/${encodeURIComponent(chatId)}/tags`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tags })
    }
  );
  if (res.status === 401 || res.status === 403) {
    const error = await res.json().catch(() => ({ error: 'Não autorizado' }));
    throw new Error(error.error || 'Você não tem permissão para editar esta conversa');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Chat;
}

export async function updateChatStage(instanceId: string, chatId: string, stage: string): Promise<Chat> {
  const res = await fetch(
    `${baseUrl()}/api/instances/${encodeURIComponent(instanceId)}/chats/${encodeURIComponent(chatId)}/stage`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stage })
    }
  );
  if (res.status === 401 || res.status === 403) {
    const error = await res.json().catch(() => ({ error: 'Não autorizado' }));
    throw new Error(error.error || 'Você não tem permissão para editar esta conversa');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Chat;
}

export async function getCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  const res = await fetch(`${baseUrl()}/api/auth/me`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return null;
  return await res.json();
}

export type ContactInfo = {
  chatId: string;
  name: string | null;
  number: string;
  isGroup: boolean;
  profilePicUrl: string | null;
  messageCount: number;
  firstMessageDate: string | null;
  lastMessageDate: string | null;
  isBusiness: boolean;
  isMyContact: boolean;
};

export async function getContactInfo(instanceId: string, chatId: string): Promise<ContactInfo> {
  const res = await fetch(
    `${baseUrl()}/api/instances/${encodeURIComponent(instanceId)}/chats/${encodeURIComponent(chatId)}/contact`,
    { headers: getAuthHeaders() }
  );
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    throw new Error('Não autenticado');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ContactInfo;
}

export type Metrics = {
  totalChats: number;
  totalMessages: number;
  totalUsers: number;
  chatsByStage: Record<string, number>;
  chatsByUser: Record<string, number>;
  averageResponseTime: number;
  conversionRate: number;
};

export async function getMetrics(): Promise<Metrics> {
  const res = await fetch(`${baseUrl()}/api/metrics`, {
    headers: getAuthHeaders()
  });
  if (res.status === 401 || res.status === 403) {
    const error = await res.json().catch(() => ({ error: 'Acesso negado' }));
    throw new Error(error.error || 'Você não tem permissão para ver métricas');
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as Metrics;
}


