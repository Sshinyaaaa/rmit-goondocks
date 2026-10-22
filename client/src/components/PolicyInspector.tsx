import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Skull, Terminal, Server } from 'lucide-react';
import { BlindOrbitState } from '../types';
import { apiTriggerAdminBreach } from '../services/tidecloakClient';

interface PolicyInspectorProps {
  state: BlindOrbitState;
  onStateChange: (newState: BlindOrbitState) => void;
}

export const PolicyInspector: React.FC<PolicyInspectorProps> = ({ state, onStateChange }) => {
  const [archView, setArchView] = useState<'legacy' | 'tidecloak'>('tidecloak');
  const [breachAlert, setBreachAlert] = useState<string | null>(null);
  const [testingBreach, setTestingBreach] = useState(false);

  const handleAdminBreachAttempt = async () => {
    setTestingBreach(true);
    try {
      const res = await apiTriggerAdminBreach();
      setBreachAlert(res.reason);
      onStateChange(res.state);
    } finally {
      setTestingBreach(false);
    }
  };

  const livePolicyJson = {
    policyId: 'tidecloak-emergent-conjunction-v1',
    realm: state.tideCloakServer.realm,
    masterKeysAtRest: 0,
    quorum: {
      threshold: 3,
      conditions: [
        { party: 'ssn_radar', signed: state.quorum.ssn_radar.signed },
        { party: 'dod_recon', signed: state.quorum.dod.signed },
        { party: 'starlink_ops', signed: state.quorum.starlink.signed },
      ],
    },
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            The Trust Bottleneck vs. TideCloak Inspector
          </h2>
        </div>

        <div className="inline-flex rounded-lg p-0.5 bg-zinc-950 border border-zinc-800 text-xs">
          <button
            onClick={() => setArchView('legacy')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              archView === 'legacy' ? 'bg-red-950 text-red-200 border border-red-700/60' : 'text-zinc-400'
            }`}
          >
            Legacy Clearinghouse
          </button>
          <button
            onClick={() => setArchView('tidecloak')}
            className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              archView === 'tidecloak' ? 'bg-cyan-950 text-cyan-200 border border-cyan-700/60' : 'text-zinc-400'
            }`}
          >
            TideCloak Emergent Authority
          </button>
        </div>
      </div>

      {archView === 'legacy' ? (
        <div className="p-3 rounded-lg bg-red-950/25 border border-red-800/60 text-xs text-zinc-300">
          <strong className="text-red-300 block mb-1">LEGACY CENTRALIZED CLEARINGHOUSE FAILURE:</strong>
          Requires uploading raw orbital trajectories to a central server where root administrators hold persistent decryption keys.
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-cyan-950/25 border border-cyan-800/60 text-xs text-zinc-300">
          <strong className="text-cyan-300 block mb-1">TIDECLOAK EMERGENT AUTHORITY (0 MASTER KEYS):</strong>
          Trajectories remain encrypted at rest. Authority to compute an avoidance burn emerges for 15 seconds only when Radar + DoD + Commercial signatures align.
        </div>
      )}

      <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
            <Skull className="w-4 h-4 text-red-400" />
            Unilateral Platform Admin Inspection Test
          </div>
          <button
            onClick={handleAdminBreachAttempt}
            disabled={testingBreach}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/50 cursor-pointer"
          >
            Attempt Platform Admin Read
          </button>
        </div>

        {breachAlert && (
          <div className="p-2.5 rounded bg-red-950/90 border border-red-600 text-[11px] text-red-200">
            <div className="font-bold text-red-300">✗ TIDECLOAK CRYPTOGRAPHIC REJECTION</div>
            <div>{breachAlert}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
          <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 mb-1">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            tidecloak-policy.json
          </div>
          <pre className="text-[10px] text-cyan-300 overflow-x-auto">{JSON.stringify(livePolicyJson, null, 2)}</pre>
        </div>

        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
          <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 mb-1">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Cryptographic Audit Ledger
          </div>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto text-[10px]">
            {state.auditLogs.map((log) => (
              <div key={log.id} className="p-1.5 rounded bg-zinc-900/90 border border-zinc-800/80">
                <div className="flex justify-between font-bold text-zinc-300">
                  <span>{log.action}</span>
                  <span className="text-cyan-400">{log.status}</span>
                </div>
                <div className="text-zinc-400">{log.details}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
