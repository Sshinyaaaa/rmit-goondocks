import React, { useEffect, useState } from 'react';
import { Satellite, Clock, LogIn } from 'lucide-react';
import { BlindOrbitState } from './types';
import { fetchState, tideClient, TideAuthIdentity } from './services/tidecloakClient';
import { OrbitalCanvas } from './components/OrbitalCanvas';
import { ConjunctionWorkflow } from './components/ConjunctionWorkflow';
import { PolicyInspector } from './components/PolicyInspector';

export function App() {
  const [state, setState] = useState<BlindOrbitState | null>(null);
  const [identity, setIdentity] = useState<TideAuthIdentity | null>(null);
  const [tcaSeconds, setTcaSeconds] = useState(18 * 3600 + 42 * 60 + 19);

  useEffect(() => {
    tideClient.init().then(setIdentity);
    fetchState().then(setState).catch(console.error);

    const poll = setInterval(() => {
      fetchState().then(setState).catch(() => {});
    }, 2000);

    const timer = setInterval(() => {
      setTcaSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(poll);
      clearInterval(timer);
    };
  }, []);

  const formatCountdown = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `T - ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center font-mono text-sm">
        Connecting to BlindOrbit Backend on http://localhost:3001...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-mono">
      <header className="border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-wider text-white">BLINDORBIT</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                TIDECLOAK EMERGENT AUTHORITY
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Zero-Custody Classified & Commercial Satellite Conjunction Avoidance
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span
              className={`w-2 h-2 rounded-full ${
                state.tideCloakServer.reachable ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="text-zinc-300">
              {state.tideCloakServer.reachable
                ? `TideCloak Container: ONLINE`
                : 'TideCloak: Local Enclave Mode'}
            </span>
          </div>

          <button
            onClick={() => tideClient.loginWithTideSSO()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-400" />
            {identity?.authenticated ? `SSO: ${identity.username}` : 'TideCloak SSO'}
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-700/60 text-amber-300 font-bold">
            <Clock className="w-3.5 h-3.5" />
            TCA: {formatCountdown(tcaSeconds)}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 max-w-[1600px] w-full mx-auto">
        <div className="xl:col-span-5 flex flex-col">
          <OrbitalCanvas
            resolvedManeuver={state.resolutionResult}
            dodIngested={Boolean(state.payloads.dod)}
            starlinkIngested={Boolean(state.payloads.starlink)}
          />
        </div>

        <div className="xl:col-span-7 flex flex-col gap-4">
          <ConjunctionWorkflow state={state} onStateChange={setState} />
          <PolicyInspector state={state} onStateChange={setState} />
        </div>
      </main>
    </div>
  );
}

export default App;
