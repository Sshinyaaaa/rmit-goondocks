import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const TIDECLOAK_URL = process.env.TIDECLOAK_URL || 'http://localhost:8080';
const TIDECLOAK_REALM = process.env.TIDECLOAK_REALM || 'blindorbit';

export interface TideCloakStatus {
  reachable: boolean;
  serverUrl: string;
  realm: string;
  qeaGovernanceEnabled: boolean;
  checkedAt: string;
}

const client = jwksClient({
  jwksUri: `${TIDECLOAK_URL}/realms/${TIDECLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  rateLimit: true,
  timeout: 3000,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error('No KID in JWT header'));
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) return callback(err || new Error('Signing key not found'));
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export async function checkTideCloakHealth(): Promise<TideCloakStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${TIDECLOAK_URL}/realms/${TIDECLOAK_REALM}/.well-known/openid-configuration`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      return {
        reachable: true,
        serverUrl: TIDECLOAK_URL,
        realm: TIDECLOAK_REALM,
        qeaGovernanceEnabled: true,
        checkedAt: new Date().toISOString(),
      };
    }

    const masterRes = await fetch(`${TIDECLOAK_URL}/realms/master/.well-known/openid-configuration`);
    return {
      reachable: masterRes.ok,
      serverUrl: TIDECLOAK_URL,
      realm: masterRes.ok ? 'master (blindorbit realm pending)' : TIDECLOAK_REALM,
      qeaGovernanceEnabled: masterRes.ok,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      reachable: false,
      serverUrl: TIDECLOAK_URL,
      realm: TIDECLOAK_REALM,
      qeaGovernanceEnabled: false,
      checkedAt: new Date().toISOString(),
    };
  }
}

export function verifyTideCloakJwt(token: string): Promise<jwt.JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ['RS256', 'EdDSA', 'ES256'] }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as jwt.JwtPayload);
    });
  });
}
