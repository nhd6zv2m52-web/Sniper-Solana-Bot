export type OpportunityDecision =
  | "ENTER"
  | "WAIT"
  | "REJECT";

export interface OpportunityRecord {
  id: string;
  timestamp: string;
  slot: number;
  signature: string;
  pool?: string;
  tokenMint?: string;
  strategy: string;
  decision: OpportunityDecision;
  reason?: string;
}

export function createOpportunityRecord(params: {
  slot: number;
  signature: string;
  pool?: string;
  tokenMint?: string;
  strategy?: string;
  decision?: OpportunityDecision;
  reason?: string;
}): OpportunityRecord {
  return {
    id: `${params.slot}-${params.signature.slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    slot: params.slot,
    signature: params.signature,
    pool: params.pool,
    tokenMint: params.tokenMint,
    strategy: params.strategy || "METEORA_ONLY",
    decision: params.decision || "WAIT",
    reason: params.reason,
  };
}

export function printOpportunityRecord(
  record: OpportunityRecord
): void {
  console.log("");
  console.log("📊 OPORTUNIDAD REGISTRADA");
  console.log(`ID: ${record.id}`);
  console.log(`Hora: ${record.timestamp}`);
  console.log(`Slot: ${record.slot}`);
  console.log(`Firma: ${record.signature}`);
  console.log(`Pool: ${record.pool || "pendiente"}`);
  console.log(
    `Token: ${record.tokenMint || "pendiente"}`
  );
  console.log(`Estrategia: ${record.strategy}`);
  console.log(`Decisión: ${record.decision}`);
  console.log(`Motivo: ${record.reason || "pendiente"}`);
}