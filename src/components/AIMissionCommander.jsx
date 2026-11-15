/**
 * AIMissionCommander — ARES-NAV §18 AI-Assisted Mission Intelligence
 * Floating HUD chat panel powered by Google Gemini
 * 
 * Deterministic first: reads live app state → sends structured context to Gemini
 * LLM explains results in natural language — never fabricates NASA data
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  askMissionCommander,
  buildMissionContext,
  SUGGESTED_QUESTIONS,
} from '../utils/aiMissionIntelligence';
import { Bot, Send, X, ChevronDown, ChevronUp, Zap, AlertTriangle, Loader2 } from 'lucide-react';

const MAX_HISTORY = 20; // cap context window

export function AIMissionCommander({
  routeType,
  activeRoute,
  evaConfig,
  evaElapsedSeconds,
  dustStorm,
  selectedTarget,
  viewMode,
  comparedRoutes,
  onClose,
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '🛸 **ARES-AI ONLINE**\n\nMission context loaded. I have live access to your route metrics, life-support calculations, NASA terrain data, and CRISM mineralogy detections.\n\nAsk me anything about this EVA. Keep it brief — you\'re in a pressure suit.',
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggested, setShowSuggested] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildCtx = useCallback(() =>
    buildMissionContext({
      routeType,
      activeRoute,
      evaConfig,
      evaElapsedSeconds,
      dustStorm,
      selectedTarget,
      viewMode,
      comparedRoutes,
    }),
    [routeType, activeRoute, evaConfig, evaElapsedSeconds, dustStorm, selectedTarget, viewMode, comparedRoutes]
  );

  const sendQuestion = useCallback(async (question) => {
    if (!question.trim() || loading) return;
    setShowSuggested(false);
    setError(null);
    const userMsg = { role: 'user', text: question.trim(), ts: Date.now() };
    setMessages(prev => [...prev.slice(-MAX_HISTORY), userMsg]);
    setInput('');
    setLoading(true);

    try {
      const ctx = buildCtx();
      const answer = await askMissionCommander(question.trim(), ctx);
      setMessages(prev => [...prev, { role: 'assistant', text: answer, ts: Date.now() }]);
    } catch (err) {
      const errText = err?.message || String(err);
      setError(errText);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `⚠️ **COMMS ERROR:** ${errText}\n\nCheck API key and network connection.`,
        ts: Date.now(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, buildCtx]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuestion(input);
  };

  const formatText = (text) => {
    // Simple markdown-like rendering for bold, newlines
    return text
      .split('\n')
      .map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} className="text-cyan-300">{part.slice(2, -2)}</strong>
                : part
            )}
            {i < text.split('\n').length - 1 && <br />}
          </span>
        );
      });
  };

  if (minimized) {
    return (
      <div
        className="hud-glass rounded-2xl px-4 py-2.5 flex items-center gap-2 cursor-pointer border-indigo-500/40 hover:border-indigo-300 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        onClick={() => setMinimized(false)}
      >
        <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
        <span className="text-xs font-mono font-bold text-indigo-300">ARES-AI ONLINE</span>
        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
      </div>
    );
  }

  return (
    <div className="hud-glass rounded-2xl border border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.25)] flex flex-col overflow-hidden max-w-[calc(100vw-1.5rem)]"
         style={{ width: 'min(360px, calc(100vw - 1.5rem))', maxHeight: '75vh' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-indigo-500/20 bg-indigo-950/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-indigo-300">ARES-AI MISSION COMMANDER</div>
            <div className="text-[9px] font-mono text-slate-500">Powered by Google Gemini Intelligence</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <button
            onClick={() => setMinimized(true)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Context Status Bar ── */}
      <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/60 flex items-center gap-3 text-[9px] font-mono text-slate-500">
        <span className="text-emerald-400">◆ ROUTE: {routeType?.toUpperCase()}</span>
        <span className="text-cyan-400">◆ O₂: {(() => {
          const elapsed = (evaElapsedSeconds || 0);
          const elapsedMin = Math.floor(elapsed / 60);
          const o2Used = (evaConfig?.o2ConsumptionLmin || 0.84) * elapsedMin;
          const o2Remaining = (evaConfig?.o2CapacityL || 862) - o2Used;
          const pct = Math.max(0, (o2Remaining / (evaConfig?.o2CapacityL || 862)) * 100);
          return pct.toFixed(0);
        })()}%</span>
        {dustStorm && <span className="text-red-400 animate-pulse">⚠ DUST STORM</span>}
        <span className="text-purple-400">◆ {selectedTarget?.shortName ?? 'NO TARGET'}</span>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs font-mono leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-700/50 text-indigo-100 border border-indigo-500/30 rounded-br-sm'
                : msg.isError
                ? 'bg-red-950/60 text-red-300 border border-red-500/30 rounded-bl-sm'
                : 'bg-slate-900/80 text-slate-200 border border-slate-700/50 rounded-bl-sm'
            }`}>
              {msg.role === 'assistant' && !msg.isError && (
                <div className="flex items-center gap-1 mb-1 text-[9px] text-indigo-400 font-bold">
                  <Bot className="w-2.5 h-2.5" />
                  ARES-AI
                </div>
              )}
              <div>{formatText(msg.text)}</div>
              <div className="text-[8px] text-slate-600 mt-1">
                {new Date(msg.ts).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl rounded-bl-sm px-3 py-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              <span className="text-xs font-mono text-slate-400">Processing mission data…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggested Questions ── */}
      {showSuggested && (
        <div className="px-3 pb-2 border-t border-slate-800/60 pt-2">
          <div className="text-[9px] font-mono text-slate-500 mb-1.5 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            QUICK INTEL QUERIES
          </div>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {SUGGESTED_QUESTIONS.slice(0, 6).map((q, i) => (
              <button
                key={i}
                onClick={() => sendQuestion(q)}
                disabled={loading}
                className="text-[9px] font-mono px-2 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:border-indigo-400 hover:text-indigo-100 transition-all cursor-pointer disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <form onSubmit={handleSubmit} className="px-3 py-2.5 border-t border-indigo-500/20 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask mission intelligence…"
            disabled={loading}
            className="flex-1 bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.4)]"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <div className="text-[8px] font-mono text-slate-700 mt-1 flex items-center gap-1">
          <AlertTriangle className="w-2 h-2" />
          ARES-NAV model estimates — not NASA-certified values
        </div>
      </form>
    </div>
  );
}
