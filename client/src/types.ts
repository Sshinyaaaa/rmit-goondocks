export interface TideCloakServerStatus {
  reachable: boolean;
  serverUrl: string;
  realm: string;
  qeaGovernanceEnabled: boolean;
  checkedAt: string;
}

export interface EncryptedPayloadView {
  operator: 'dod' | 'starlink';
  satelliteName: string;
  cipherTextHex: string;
  ivHex: string;
  authTagHex: string;
  keyCommitmentHash: string;
  uploadedAt: string;
  tideTag: string;
}

export interface QuorumPartyStatus {
  id: 'ssn_radar' | 'dod' | 'starlink';
  label: string;
  roleRequired: string;
  signed: boolean;
  signatureHash?: string;
  signedByUser?: string;
  verifiedVia: 'TIDECLOAK_OIDC_JWT' | 'WEBCRYPTO_ECDSA' | 'PENDING';
  timestamp?: string;
}

export interface EphemeralTokenView {
  tokenId: string;
  tokenSecret: string;
  expiresAt: number;
  ttlSeconds: number;
  quorumProofHash: string;
}

export interface ManeuverRecommendation {
  recommendationId: string;
  ticketId: string;
  computedAtUTC: string;
  primaryAsset: string;
  maneuveringAsset: string;
  initialMissDistanceKm: number;
  postBurnMissDistanceKm: number;
  deltaVVectorMps: {
    radial: number;
    inTrack: number;
    crossTrack: number;
    magnitude: number;
  };
  burnExecutionTimeTMinusHours: number;
  collisionProbabilityBefore: string;
  collisionProbabilityAfter: string;
  enclaveAttestationHash: string;
  keyDestroyedAtUTC: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  status: 'ALLOWED' | 'BLOCKED' | 'EMERGENT_GRANT' | 'KEY_DESTROYED';
  details: string;
  proofHash: string;
}

export interface BlindOrbitState {
  ticketId: string;
  tideCloakServer: TideCloakServerStatus;
  payloads: {
    dod: EncryptedPayloadView | null;
    starlink: EncryptedPayloadView | null;
  };
  quorum: {
    ssn_radar: QuorumPartyStatus;
    dod: QuorumPartyStatus;
    starlink: QuorumPartyStatus;
  };
  ephemeralToken: EphemeralTokenView | null;
  resolutionResult: ManeuverRecommendation | null;
  auditLogs: AuditLogEntry[];
}
