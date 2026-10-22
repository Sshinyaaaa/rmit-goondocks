import { IAMService } from '@tidecloak/js';
import { BlindOrbitState } from '../types';

export interface TideAuthIdentity {
  authenticated: boolean;
  username?: string;
  token?: string;
  mode: 'LIVE_TIDECLOAK_SSO' | 'WEBCRYPTO_ENCLAVE';
}

class TideCloakFrontendAdapter {
  private initialized = false;
  private liveSsoActive = false;

  public async init(): Promise<TideAuthIdentity> {
    if (this.initialized) return this.getIdentity();
    this.initialized = true;
    try {
      const cfgRes = await fetch('/tidecloak.json');
      if (cfgRes.ok) {
        const config = await cfgRes.json();
        if (config?.jwk?.keys && config.jwk.keys.length > 0) {
          await IAMService.initIAM(config);
          this.liveSsoActive = true;
        }
      }
    } catch {
      this.liveSsoActive = false;
    }
    return this.getIdentity();
  }

  public async getIdentity(): Promise<TideAuthIdentity> {
    if (this.liveSsoActive && IAMService.isLoggedIn()) {
      const token = await IAMService.getToken();
      const username = IAMService.getName() || 'TideOperator';
      return { authenticated: true, username, token, mode: 'LIVE_TIDECLOAK_SSO' };
    }
    return {
      authenticated: false,
      mode: this.liveSsoActive ? 'LIVE_TIDECLOAK_SSO' : 'WEBCRYPTO_ENCLAVE',
    };
  }

  public loginWithTideSSO() {
    if (this.liveSsoActive) {
      IAMService.doLogin();
    } else {
      window.open('http://localhost:8080', '_blank');
    }
  }

  public async encryptEphemerisClientSide(operator: 'dod' | 'starlink'): Promise<string> {
    const rawTelemetry = JSON.stringify({
      operator,
      timestamp: Date.now(),
      classification: operator === 'dod' ? 'TOP_SECRET_NRO' : 'PROPRIETARY_STARLINK',
    });

    const enc = new TextEncoder().encode(rawTelemetry);
    const key = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cipherBuf = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
    return Array.from(new Uint8Array(cipherBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public async generateHardwareKeySignature(party: string, ticketId: string): Promise<string> {
    const keyPair = await window.crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
    const payload = new TextEncoder().encode(`TIDECLOAK_QUORUM:${ticketId}:${party}:${Date.now()}`);
    const sigBuf = await window.crypto.subtle.sign({ name: 'ECDSA', hash: { name: 'SHA-256' } }, keyPair.privateKey, payload);
    return (
      '0x' +
      Array.from(new Uint8Array(sigBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 48)
    );
  }
}

export const tideClient = new TideCloakFrontendAdapter();

export async function fetchState(): Promise<BlindOrbitState> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error('Failed to fetch BlindOrbit backend state');
  return res.json();
}

export async function apiIngestPayload(operator: 'dod' | 'starlink'): Promise<BlindOrbitState> {
  const clientCipherHex = await tideClient.encryptEphemerisClientSide(operator);
  const res = await fetch('/api/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operator, clientCipherHex }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to ingest payload');
  return data.state;
}

export async function apiSignQuorum(
  party: 'ssn_radar' | 'dod' | 'starlink',
  ticketId: string,
  actorName: string
): Promise<BlindOrbitState> {
  const identity = await tideClient.getIdentity();
  const clientSignatureHex = await tideClient.generateHardwareKeySignature(party, ticketId);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (identity.token) headers['Authorization'] = `Bearer ${identity.token}`;

  const res = await fetch('/api/sign', {
    method: 'POST',
    headers,
    body: JSON.stringify({ party, clientSignatureHex, actorName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sign quorum');
  return data.state;
}

export async function apiResolveConjunction(tokenSecret: string): Promise<BlindOrbitState> {
  const res = await fetch('/api/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenSecret }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Conjunction resolution rejected');
  return data.state;
}

export async function apiTriggerAdminBreach(): Promise<{ reason: string; state: BlindOrbitState }> {
  const res = await fetch('/api/admin-breach-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminActor: 'db-admin@global-space-clearinghouse.org' }),
  });
  const data = await res.json();
  return { reason: data.reason, state: data.state };
}

export async function apiResetSession(): Promise<BlindOrbitState> {
  const res = await fetch('/api/reset', { method: 'POST' });
  const data = await res.json();
  return data.state;
}
