import React, { useState } from 'react';
import { Lock, Radar, KeyRound, Cpu, CheckCircle2, Play, RotateCcw, Sparkles, Flame } from 'lucide-react';
import { BlindOrbitState } from '../types';
import {
  apiIngestPayload,
  apiSignQuorum,
  apiResolveConjunction,
  apiResetSession,
} from '../services/tidecloakClient';

interface ConjunctionWorkflowProps {
  state: BlindOrbitState;
  onStateChange: (newState: BlindOrbitState) => void;
}

export const ConjunctionWorkflow: React.FC<ConjunctionWorkflowProps> = ({ state, onStateChange }) => {
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bothIngested = Boolean(state.payloads.dod && state.payloads.starlink);

  const runAction = async (label: string, fn: () => Promise<BlindOrbitState>) => {
    setBusyAction(label);
    setErrorMsg(null);
    try {
      const updated = await fn();
      onStateChange(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setBusyAction(null);
    }
  };

  const runJudgeAutoDemo = async () => {
    setBusyAction('auto-demo');
    setErrorMsg(null);
    try {
      let current = await apiResetSession();
      onStateChange(current);
      await new Promise((r) => setTimeout(r, 400));

      current = await apiIngestPayload('dod');
      onStateChange(current);
      await new Promise((r) => setTimeout(r, 400));

      current = await apiIngestPayload('starlink');
      onStateChange(current);
      await new Promise((r) => setTimeout(r, 400));

      current = await apiSignQuorum('ssn_radar', current.ticketId, 'SSN-Radar-AutoOracle');
      onStateChange(current);
      await new Promise((r) => setTimeout(r, 400));

      current = await apiSignQuorum('dod', current.ticketId, 'Col. Vance (NRO FIDO2 CAC)');
      onStateChange(current);
      await new Promise((r) => setTimeout(r, 400));

      current = await apiSignQuorum('starlink', current.ticketId, 'Starlink-FlightDir-Auth');
      onStateChange(current);
      await new Promise((r) => setTimeout(r, 600));

      if (current.ephemeralToken) {
        current = await apiResolveConjunction(current.ephemeralToken.tokenSecret);
        onStateChange(current);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            Emergent Conjunction Resolution Workflow
          </h2>
          <p className="text-xs text-zinc-400">
            Execute the 4-stage zero-custody TideCloak workflow or trigger the automated walkthrough.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runJudgeAutoDemo}
            disabled={busyAction !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {busyAction === 'auto-demo' ? 'Running Walkthrough...' : 'Run Auto-Demo'}
          </button>

          <button
            onClick={() => runAction('reset', apiResetSession)}
            disabled={busyAction !== null}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700 text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      <div className="p-3.5 rounded-lg bg-zinc-950/90 border border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase text-zinc-200">
              Step 1: Client-Side Sealed Ephemeris Ingestion (AES-256-GCM)
            </span>
          </div>
          {bothIngested && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sealed at Rest
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300">USA-326 (DoD Recon)</span>
              <button
                onClick={() => runAction('dod-ingest', () => apiIngestPayload('dod'))}
                disabled={Boolean(state.payloads.dod) || busyAction !== null}
                className="px-2.5 py-1 rounded text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 disabled:opacity-50 cursor-pointer"
              >
                {state.payloads.dod ? 'Encrypted Blob Loaded' : 'Seal & Upload DoD Ephemeris'}
              </button>
            </div>
            {state.payloads.dod && (
              <div className="text-[10px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800 break-all">
                <div>TAG: <span className="text-amber-300">{state.payloads.dod.tideTag}</span></div>
                <div>CIPHER: {state.payloads.dod.cipherTextHex}</div>
              </div>
            )}
          </div>

          <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300">Starlink-4921 (Broadband)</span>
              <button
                onClick={() => runAction('star-ingest', () => apiIngestPayload('starlink'))}
                disabled={Boolean(state.payloads.starlink) || busyAction !== null}
                className="px-2.5 py-1 rounded text-[11px] font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 disabled:opacity-50 cursor-pointer"
              >
                {state.payloads.starlink ? 'Encrypted Blob Loaded' : 'Seal & Upload Starlink Ephemeris'}
              </button>
            </div>
            {state.payloads.starlink && (
              <div className="text-[10px] text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-800 break-all">
                <div>TAG: <span className="text-cyan-300">{state.payloads.starlink.tideTag}</span></div>
                <div>CIPHER: {state.payloads.starlink.cipherTextHex}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-zinc-950/90 border border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase text-zinc-200">
              Steps 2 & 3: Public Radar Trigger + Bilateral Operator Quorum Signing
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <Radar className="w-3.5 h-3.5 text-red-400" />
                18th SDS Public Radar
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Flags 2.40 km intersection risk.</p>
            </div>
            <button
              onClick={() => runAction('sign-radar', () => apiSignQuorum('ssn_radar', state.ticketId, '18th-SDS-Radar-Oracle'))}
              disabled={!bothIngested || state.quorum.ssn_radar.signed || busyAction !== null}
              className="w-full py-1.5 px-2 rounded text-[11px] font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 disabled:opacity-40 cursor-pointer"
            >
              {state.quorum.ssn_radar.signed ? '✓ Radar Hazard Attested' : '1. Attest Radar Trigger'}
            </button>
          </div>

          <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-amber-300">DoD Recon Officer</div>
              <p className="text-[11px] text-zinc-400 mt-1">Co-signs via FIDO2 / TideCloak JWT.</p>
            </div>
            <button
              onClick={() => runAction('sign-dod', () => apiSignQuorum('dod', state.ticketId, 'Col. Vance (NRO CAC/Tide)'))}
              disabled={!bothIngested || state.quorum.dod.signed || busyAction !== null}
              className="w-full py-1.5 px-2 rounded text-[11px] font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 disabled:opacity-40 cursor-pointer"
            >
              {state.quorum.dod.signed ? '✓ DoD Signature Verified' : '2. Sign as DoD Officer'}
            </button>
          </div>

          <div className="p-2.5 rounded border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-cyan-300">Starlink Flight Director</div>
              <p className="text-[11px] text-zinc-400 mt-1">Co-signs with Constellation key.</p>
            </div>
            <button
              onClick={() => runAction('sign-starlink', () => apiSignQuorum('starlink', state.ticketId, 'Starlink-Ops-Director'))}
              disabled={!bothIngested || state.quorum.starlink.signed || busyAction !== null}
              className="w-full py-1.5 px-2 rounded text-[11px] font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 disabled:opacity-40 cursor-pointer"
            >
              {state.quorum.starlink.signed ? '✓ Starlink Signature Verified' : '3. Sign as Starlink Director'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-lg bg-zinc-950/90 border border-zinc-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase text-zinc-200">
              Step 4: Emergent Authority Synthesis & Sandboxed Delta-V Execution
            </span>
          </div>

          {state.ephemeralToken && (
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[11px] font-semibold animate-pulse">
              EPHEMERAL TOKEN ACTIVE • TTL: {state.ephemeralToken.ttlSeconds}s
            </span>
          )}
        </div>

        {state.ephemeralToken && !state.resolutionResult && (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-700/60 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs space-y-0.5">
              <div className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                TideCloak Ephemeral Authority Token Synthesized: {state.ephemeralToken.tokenId}
              </div>
              <div className="text-[11px] text-zinc-400">
                Quorum Proof: {state.ephemeralToken.quorumProofHash}
              </div>
            </div>

            <button
              onClick={() => runAction('resolve', () => apiResolveConjunction(state.ephemeralToken!.tokenSecret))}
              disabled={busyAction !== null}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition cursor-pointer"
            >
              Execute Enclave Delta-V Solver Now
            </button>
          </div>
        )}

        {state.resolutionResult && (
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-600/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-400" />
                MANEUVER ORDER ISSUED • EPHEMERAL KEY SELF-DESTRUCTED
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                ID: {state.resolutionResult.recommendationId}
              </span>
            </div>

            <p className="text-xs text-zinc-100 leading-relaxed">
              <strong>{state.resolutionResult.maneuveringAsset}</strong> executes{' '}
              <span className="text-emerald-300 font-bold">
                +{state.resolutionResult.deltaVVectorMps.inTrack} m/s prograde burn
              </span>{' '}
              at <strong>T - {state.resolutionResult.burnExecutionTimeTMinusHours}h</strong>.
              Resulting miss distance increases from{' '}
              <span className="text-red-300">{state.resolutionResult.initialMissDistanceKm} km</span> to{' '}
              <span className="text-emerald-300 font-bold">{state.resolutionResult.postBurnMissDistanceKm} km</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
