/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  Send, 
  Search, 
  History, 
  Settings, 
  CheckCircle2, 
  Loader2, 
  UserPlus,
  RefreshCw,
  PhoneIncoming,
  Info,
  ExternalLink,
  ShieldCheck,
  Zap,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';
import { CapturedCall, AppState } from './types';
import { syncWithTelegram, formatPhone } from './services/contactService';

export default function App() {
  const [state, setState] = useState<AppState>({
    calls: [],
    isTracking: true
  });

  const [simulating, setSimulating] = useState(false);
  const [showBridgeInfo, setShowBridgeInfo] = useState(false);
  const [showTgSettings, setShowTgSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualPhone, setManualPhone] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const res = await fetch('/api/calls');
        const data = await res.json();
        setState(prev => ({
          ...prev,
          calls: data,
          // Auto select first call if none selected
          selectedCallId: prev.selectedCallId || (data.length > 0 ? data[0].id : undefined)
        }));
      } catch (e) {
        console.error("Failed to fetch calls", e);
      }
    };

    fetchCalls();
    const interval = setInterval(fetchCalls, 2000);
    return () => clearInterval(interval);
  }, []);

  const simulateCall = useCallback(async () => {
    setSimulating(true);
    try {
      const randomNum = `79${Math.floor(100000000 + Math.random() * 900000000)}`;
      await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: randomNum })
      });
    } catch (e) {
      console.error("Simulation failed", e);
    }
    setSimulating(false);
  }, []);

  const submitManualPhone = async () => {
    if (!manualPhone) return;
    setSimulating(true);
    try {
      await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: manualPhone })
      });
      setManualPhone('');
      setShowManualEntry(false);
    } catch (e) {
      console.error("Manual entry failed", e);
    }
    setSimulating(false);
  };

  const processCall = async (id: string) => {
    if (!state.tgApiId || !state.tgApiHash) {
      setShowTgSettings(true);
      return;
    }

    try {
      await fetch('/api/sync-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          callId: id,
          apiId: state.tgApiId,
          apiHash: state.tgApiHash
        })
      });
      // The state will refresh on next poll
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  const copyEndpoint = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/webhook/call`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen w-full bg-[#f8fafc] flex flex-col font-sans text-slate-900 overflow-hidden selection:bg-blue-100 max-w-md mx-auto shadow-2xl border-x border-slate-200">
      {/* Top Header Navigation */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0088cc] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/10">
            T
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 leading-none">TeleSync</h1>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setShowTgSettings(!showTgSettings)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${showTgSettings ? 'bg-[#0088cc] border-[#0088cc] text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
          >
            <Send size={16} />
          </button>
          <button 
            onClick={() => setShowManualEntry(!showManualEntry)}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${showManualEntry ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
          >
            <UserPlus size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
        <AnimatePresence>
          {showManualEntry && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter phone number..."
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitManualPhone()}
                    className="w-full bg-slate-50 border border-slate-200 p-4 pr-12 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono text-sm"
                    autoFocus
                  />
                  <button 
                    onClick={submitManualPhone}
                    disabled={!manualPhone || simulating}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-900 text-white rounded-xl flex items-center justify-center"
                  >
                    {simulating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTgSettings && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border-b border-slate-100 p-8 shadow-xl relative z-10"
            >
              <h2 className="text-lg font-bold mb-6">Telegram Config</h2>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="API ID"
                  value={state.tgApiId || ''}
                  onChange={(e) => setState(s => ({ ...s, tgApiId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm"
                />
                <input 
                  type="password" 
                  placeholder="API Hash"
                  value={state.tgApiHash || ''}
                  onChange={(e) => setState(s => ({ ...s, tgApiHash: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm"
                />
                <button 
                  onClick={() => setShowTgSettings(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest"
                >
                  Save Keys
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {state.calls.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-50">
              <History size={48} strokeWidth={1} />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Queue Empty</p>
            </div>
          ) : (() => {
            const selectedCall = state.calls.find(c => c.id === state.selectedCallId) || state.calls[0];
            return (
              <div className="space-y-4 pb-20">
                {/* Active View Container (Simplified) */}
                <motion.div
                  key={selectedCall.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-50 border-2 border-white shadow-sm">
                      {selectedCall.telegramInfo?.avatarUrl ? (
                        <img src={selectedCall.telegramInfo.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-300 font-bold">
                          {selectedCall.phoneNumber.slice(-2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 leading-tight">
                        {selectedCall.telegramInfo?.fullName || 'Syncing...'}
                      </h3>
                      <p className="text-sm text-blue-500 font-medium">{selectedCall.telegramInfo?.username || '@pending'}</p>
                    </div>
                    {selectedCall.status === 'synced' && <CheckCircle2 className="ml-auto text-emerald-500" size={20} />}
                    {selectedCall.status === 'syncing' && <Loader2 className="ml-auto text-blue-400 animate-spin" size={20} />}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Phone</div>
                      <p className="font-mono text-base font-bold text-slate-700">{formatPhone(selectedCall.phoneNumber)}</p>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Telegram Bio</div>
                      <p className="text-sm text-slate-500 italic leading-relaxed">
                        {selectedCall.telegramInfo?.bio || 'Searching info...'}
                      </p>
                    </div>
                  </div>

                  {selectedCall.telegramInfo?.username && (
                    <a 
                      href={`https://t.me/${selectedCall.telegramInfo.username.replace('@', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 w-full py-4 bg-[#0088cc] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                      Open Telegram <ExternalLink size={14} />
                    </a>
                  )}
                </motion.div>

                {/* Queue Label */}
                <div className="flex items-center gap-2 px-2 pt-4">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Recent Calls</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                {/* Vertical Queue - Minimalist Card */}
                {state.calls.slice(0, 10).map((call) => (
                  <motion.div
                    key={call.id}
                    onClick={() => setState(s => ({ ...s, selectedCallId: call.id }))}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      state.selectedCallId === call.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-slate-700">{formatPhone(call.phoneNumber)}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {call.telegramInfo && (
                      <p className="text-[10px] text-blue-500 font-medium mt-1 uppercase tracking-tight">
                        Found: {call.telegramInfo.fullName}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            );
          })()}
        </div>
      </main>

      {/* Simplified Mobile Footer */}
      <footer className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service Active</span>
        </div>
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">v2.4 Pro</div>
      </footer>
    </div>
  );
}
