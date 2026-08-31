import { Connection } from "@solana/web3.js";

const RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

const METEORA_PROGRAM = "Meteora DAMM V2";

async function main() {
  console.log("=================================");
  console.log("   SNIPER SOLANA BOT v0.1.0");
  console.log("=================================");
  console.log("Conectando a Solana...");

  const slot = await connection.getSlot();

  console.log(`Conectado. Slot actual: ${slot}`);
  console.log(`Programa objetivo: ${METEORA_PROGRAM}`);
  console.log("Modo: OBSERVACIÓN");
  console.log("Compra automática: DESACTIVADA");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});