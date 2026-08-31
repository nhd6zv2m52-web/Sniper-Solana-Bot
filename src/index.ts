import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

// Programa oficial de Meteora DAMM V2
const METEORA_PROGRAM_ID = new PublicKey(
  "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG",
);

async function main() {
  console.log("=================================");
  console.log("   SNIPER SOLANA BOT v0.2.0");
  console.log("=================================");
  console.log("Conectando a Solana...");

  const slot = await connection.getSlot();

  console.log(`Conectado. Slot actual: ${slot}`);
  console.log(`Programa objetivo: ${METEORA_PROGRAM_ID.toBase58()}`);
  console.log("Modo: OBSERVACIÓN");
  console.log("Compra automática: DESACTIVADA");
  console.log("");
  console.log("Escuchando actividad de Meteora DAMM V2...");

  connection.onLogs(
    METEORA_PROGRAM_ID,
    (logInfo) => {
      if (logInfo.err) {
        return;
      }

      console.log("");
      console.log("🚨 ACTIVIDAD METEORA DETECTADA");
      console.log(`Firma: ${logInfo.signature}`);
      console.log(`Slot: ${logInfo.context.slot}`);
      console.log("Transacción confirmada. Analizando logs...");

      for (const log of logInfo.logs) {
        console.log(`  ${log}`);
      }
    },
    "confirmed",
  );
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});