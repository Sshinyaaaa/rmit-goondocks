export interface EphemerisVector {
  satelliteId: string;
  operator: 'dod' | 'starlink';
  epochUTC: string;
  positionKm: [number, number, number];
  velocityKms: [number, number, number];
  covMatrixDiag: [number, number, number];
}

export interface EncryptedPayloadRecord {
  operator: 'dod' | 'starlink';
  satelliteName: string;
  cipherTextHex: string;
  ivHex: string;
  authTagHex: string;
  keyCommitmentHash: string;
  uploadedAt: string;
  tideTag: string;
  _sealedVector: EphemerisVector;
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

export interface EphemeralExecutionToken {
  tokenId: string;
  tokenSecret: string;
  issuedAt: number;
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
