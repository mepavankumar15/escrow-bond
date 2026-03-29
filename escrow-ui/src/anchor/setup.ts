import { Program, type Provider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { IDL, type Escrow } from "./idl";
import BN from "bn.js";
import { Buffer } from "buffer";

export const PROGRAM_ID = new PublicKey("86Jr9R4AcHkWDeKqKiohW7JCxm5rXJpfZTFM5g1spBk5");

export const getEscrowProgram = (provider: Provider) => {
  return new Program(IDL as any, provider);
};

export const getEscrowStatePDA = (maker: PublicKey, seed: BN): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), maker.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
};

export const getVaultAPDA = (escrowState: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault_a"), escrowState.toBuffer()],
    PROGRAM_ID
  );
};

export const getVaultBPDA = (escrowState: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault_b"), escrowState.toBuffer()],
    PROGRAM_ID
  );
};
