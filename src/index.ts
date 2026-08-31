import {
  Connection,
  PublicKey,
  ParsedConfirmedTransaction,
} from "@solana/web3.js";

const RPC_URL =
  process.env.SOLANA_RPC_URL ||
  "https://api.mainnet-beta.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

// Programa oficial de Meteora DAMM V2
const METEORA_PROGRAM_ID = new PublicKey(
  "cpamdpZCGKuy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG"
);

console.log("======================================");
console.log("       SNIPER SOLANA BOT v0.3.0");
console.log("======================================");
console.log("Conectando a Solana...");

connection.onLogs(
  METEORA_PROGRAM_ID,
  async (logInfo) => {
    if (logInfo.err) {
      return;
    }

    console.log("");
    console.log("🚨 ACTIVIDAD METEORA DETECTADA");
    console.log(`Firma: ${logInfo.signature}`);
    console.log(`Slot: ${logInfo.context.slot}`);
    console.log("Analizando transacción...");

    try {
      const transaction =
        await connection.getParsedTransaction(
          logInfo.signature,
          {
            maxSupportedTransactionVersion: 0,
          }
        );

      if (!transaction) {
        console.log("⚠️ No se pudo obtener la transacción.");
        return;
      }

      const accountKeys =
        transaction.transaction.message.accountKeys;

      console.log("");
      console.log("📋 CUENTAS INVOLUCRADAS:");

      for (const account of accountKeys) {
        console.log(
          `- ${account.pubkey.toBase58()}`
        );
      }

      console.log("");
      console.log("📦 INSTRUCCIONES:");

      for (const instruction of transaction.transaction.message
        .instructions) {
        if ("programId" in instruction) {
          console.log(
            `Programa: ${instruction.programId.toBase58()}`
          );
        }
      }

      console.log("");
      console.log("🔎 Estado: OBSERVACIÓN");
      console.log("💰 Compra automática: DESACTIVADA");
      console.log("======================================");
    } catch (error) {
      console.error(
        "❌ Error analizando transacción:",
        error
      );
    }
  },
  "confirmed"
);