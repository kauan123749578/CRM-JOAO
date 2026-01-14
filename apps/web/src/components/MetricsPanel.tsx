import React, { useState, useEffect } from 'react';
import type { Metrics } from '../api';
import { getMetrics } from '../api';

type Props = {
  onClose: () => void;
};

export default function MetricsPanel({ onClose }: Props) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMetrics();
      setMetrics(data);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[400px] bg-zinc-900 border-l border-zinc-800 flex flex-col h-full overflow-y-auto">
      <div className="flex justify-between items-center p-5 border-b border-zinc-800">
        <h2 className="font-bold text-white">📊 Métricas</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">
          ×
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-zinc-500">Carregando métricas...</div>
        </div>
      ) : error ? (
        <div className="p-5">
          <div className="bg-red-950/40 border border-red-700 text-red-200 rounded p-3 text-sm">
            {error}
          </div>
        </div>
      ) : metrics ? (
        <div className="p-5 space-y-6">
          {/* Cards Principais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="text-zinc-400 text-xs uppercase mb-1">Total de Chats</div>
              <div className="text-2xl font-bold text-white">{metrics.totalChats}</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="text-zinc-400 text-xs uppercase mb-1">Total de Mensagens</div>
              <div className="text-2xl font-bold text-white">{metrics.totalMessages}</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="text-zinc-400 text-xs uppercase mb-1">Atendentes</div>
              <div className="text-2xl font-bold text-white">{metrics.totalUsers}</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="text-zinc-400 text-xs uppercase mb-1">Taxa de Conversão</div>
              <div className="text-2xl font-bold text-yellow-400">{metrics.conversionRate.toFixed(1)}%</div>
            </div>
          </div>

          {/* Tempo Médio de Resposta */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <div className="text-zinc-400 text-xs uppercase mb-2">Tempo Médio de Resposta</div>
            <div className="text-3xl font-bold text-white">
              {metrics.averageResponseTime > 0 ? `${metrics.averageResponseTime} min` : 'N/A'}
            </div>
          </div>

          {/* Chats por Estágio */}
          <div>
            <div className="text-zinc-400 text-xs uppercase mb-3 font-semibold">Chats por Estágio</div>
            <div className="space-y-2">
              {Object.entries(metrics.chatsByStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <span className="text-white text-sm">{stage}</span>
                  <span className="text-yellow-400 font-bold">{count}</span>
                </div>
              ))}
              {Object.keys(metrics.chatsByStage).length === 0 && (
                <div className="text-zinc-500 text-sm italic">Nenhum dado disponível</div>
              )}
            </div>
          </div>

          {/* Chats por Atendente */}
          <div>
            <div className="text-zinc-400 text-xs uppercase mb-3 font-semibold">Chats por Atendente</div>
            <div className="space-y-2">
              {Object.entries(metrics.chatsByUser).map(([user, count]) => (
                <div key={user} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                  <span className="text-white text-sm">{user}</span>
                  <span className="text-blue-400 font-bold">{count}</span>
                </div>
              ))}
              {Object.keys(metrics.chatsByUser).length === 0 && (
                <div className="text-zinc-500 text-sm italic">Nenhum dado disponível</div>
              )}
            </div>
          </div>

          {/* Botão Atualizar */}
          <button
            onClick={loadMetrics}
            className="w-full bg-yellow-400 text-black rounded-lg py-2 font-semibold hover:bg-yellow-300 transition-colors"
          >
            Atualizar Métricas
          </button>
        </div>
      ) : null}
    </div>
  );
}



