import {
  Connection,
  PublicKey,
  ParsedConfirmedTransaction,
} from "@solana/web3.js";

import {
  createOpportunityRecord,
  printOpportunityRecord,
  saveOpportunityRecord,
} from "./opportunityLogger.js";

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

// Programa oficial de Meteora DAMM V2
const METEORA_PROGRAM_ID = new PublicKey(
  "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG"
);

function formatNumber(value: number): string {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        maximumFractionDigits: 9,
      })
    : "N/A";
}

function analyzeTokenMovements(
  transaction: ParsedConfirmedTransaction
) {
  const pre = transaction.meta?.preTokenBalances || [];
  const post = transaction.meta?.postTokenBalances || [];

  const movements = new Map<
    string,
    {
      mint: string;
      owner: string;
      before: number;
      after: number;
    }
  >();

  for (const balance of pre) {
    const key = `${balance.accountIndex}-${balance.mint}`;

    movements.set(key, {
      mint: balance.mint,
      owner: balance.owner || "desconocido",
      before: balance.uiTokenAmount.uiAmount || 0,
      after: 0,
    });
  }

  for (const balance of post) {
    const key = `${balance.accountIndex}-${balance.mint}`;
    const existing = movements.get(key);

    if (existing) {
      existing.after =
        balance.uiTokenAmount.uiAmount || 0;

      existing.owner =
        balance.owner || existing.owner;
    } else {
      movements.set(key, {
        mint: balance.mint,
        owner: balance.owner || "desconocido",
        before: 0,
        after: balance.uiTokenAmount.uiAmount || 0,
      });
    }
  }

  console.log("");
  console.log("🪙 MOVIMIENTOS DE TOKENS:");

  let foundMovement = false;

  for (const movement of movements.values()) {
    const delta =
      movement.after - movement.before;

    if (Math.abs(delta) < 0.000000001) {
      continue;
    }

    foundMovement = true;

    const direction =
      delta > 0 ? "🟢 RECIBIÓ" : "🔴 ENVIÓ";

    console.log("");
    console.log(direction);
    console.log(`Mint: ${movement.mint}`);
    console.log(`Owner: ${movement.owner}`);
    console.log(
      `Cantidad: ${formatNumber(Math.abs(delta))}`
    );
    console.log(
      `Antes: ${formatNumber(movement.before)}`
    );
    console.log(
      `Después: ${formatNumber(movement.after)}`
    );
  }

  if (!foundMovement) {
    console.log(
      "No se detectaron movimientos de tokens."
    );
  }
}

function analyzeSolMovements(
  transaction: ParsedConfirmedTransaction
) {
  const meta = transaction.meta;

  if (!meta) {
    return;
  }

  const accountKeys =
    transaction.transaction.message.accountKeys;

  console.log("");
  console.log("◎ MOVIMIENTOS DE SOL:");

  for (let i = 0; i < accountKeys.length; i++) {
    const before = meta.preBalances[i] || 0;
    const after = meta.postBalances[i] || 0;

    const deltaSol =
      (after - before) / 1_000_000_000;

    if (Math.abs(deltaSol) < 0.000001) {
      continue;
    }

    const direction =
      deltaSol > 0 ? "🟢 RECIBIÓ" : "🔴 ENVIÓ";

    console.log("");
    console.log(direction);
    console.log(
      `Cuenta: ${accountKeys[i].pubkey.toBase58()}`
    );
    console.log(
      `Cambio SOL: ${formatNumber(
        Math.abs(deltaSol)
      )}`
    );
  }
}

function identifyPoolCandidates(
  transaction: ParsedConfirmedTransaction
): PublicKey[] {
  const candidates: PublicKey[] = [];
  const seen = new Set<string>();

  for (
    const instruction of
    transaction.transaction.message.instructions
  ) {
    if (
      !instruction.programId.equals(
        METEORA_PROGRAM_ID
      )
    ) {
      continue;
    }

    if (!("accounts" in instruction)) {
      continue;
    }

    for (const account of instruction.accounts) {
      const address = account.toBase58();

      if (seen.has(address)) {
        continue;
      }

      seen.add(address);
      candidates.push(account);
    }
  }

  return candidates;
}

console.log("======================================");
console.log("       SNIPER SOLANA BOT v0.5.1");
console.log("======================================");
console.log("Conectando a Solana...");
console.log("Modo: OBSERVACIÓN");
console.log("Compra automática: DESACTIVADA");
console.log("Registro de oportunidades: ACTIVADO");
console.log("======================================");

connection.onLogs(
  METEORA_PROGRAM_ID,
  async (logInfo, context) => {
    if (logInfo.err) {
      return;
    }

    console.log("");
    console.log(
      "🚨 ACTIVIDAD METEORA DETECTADA"
    );

    console.log(
      `Firma: ${logInfo.signature}`
    );

    console.log(
      `Slot: ${context.slot}`
    );

    console.log(
      "Analizando transacción..."
    );

    try {
      const transaction =
        await connection.getParsedTransaction(
          logInfo.signature,
          {
            maxSupportedTransactionVersion: 0,
          }
        );

      if (!transaction) {
        console.log(
          "⚠️ No se pudo obtener la transacción."
        );
        return;
      }

      console.log("");
      console.log(
        "📋 CUENTAS INVOLUCRADAS:"
      );

      for (
        const account of
        transaction.transaction.message.accountKeys
      ) {
        console.log(
          `- ${account.pubkey.toBase58()}`
        );
      }

      const poolCandidates =
        identifyPoolCandidates(
          transaction
        );

      console.log("");
      console.log(
        "🏊 CANDIDATAS A POOL DAMM V2:"
      );

      if (poolCandidates.length === 0) {
        console.log(
          "⚪ No se encontraron cuentas candidatas."
        );
      } else {
        for (const candidate of poolCandidates) {
          console.log(
            `- ${candidate.toBase58()}`
          );
        }
      }

      const record =
        createOpportunityRecord({
          slot: context.slot,
          signature: logInfo.signature,
          strategy: "METEORA_ONLY",
          decision: "WAIT",
          reason:
            poolCandidates.length > 0
              ? "Actividad Meteora con cuentas candidatas a Pool"
              : "Actividad Meteora sin Pool confirmada",
        });
await saveOpportunityRecord(record);
      printOpportunityRecord(record);

      analyzeTokenMovements(
        transaction
      );

      analyzeSolMovements(
        transaction
      );

      console.log("");
      console.log(
        "======================================"
      );

      console.log(
        "🔎 ESTADO: OBSERVACIÓN"
      );

      console.log(
        "💰 COMPRA AUTOMÁTICA: DESACTIVADA"
      );

      console.log(
        "======================================"
      );

    } catch (error) {
      console.error(
        "❌ Error analizando transacción:",
        error
      );
    }
  },
  "confirmed"
);