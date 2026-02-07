import { useEffect, useState, useCallback, useRef } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { getAccount } from '@solana/spl-token';
import { PRESALE_PROGRAM_ID, TPICKS_MINT, OWNER_WALLET } from '../config';
import idl from '../idl/presale.json';

export interface PresaleState {
  owner: PublicKey;
  tokenMint: PublicKey;
  tokenVault: PublicKey;
  wallet: PublicKey;
  rate: BN;
  entranceFee: BN;
  maxBuy: BN;
  softCap: BN;
  hardCap: BN;
  lamportsRaised: BN;
  tokensSold: BN;
  statusIco: boolean;
  finalizeStatus: boolean;
  bump: number;
}

export interface BuyerStateAccount {
  presale: PublicKey;
  buyer: PublicKey;
  contributedLamports: BN;
  tokensPurchased: BN;
  bump: number;
}

// Compute PDAs once at module level — they're derived from constants and never change
const [PRESALE_PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('presale'), OWNER_WALLET.toBuffer(), TPICKS_MINT.toBuffer()],
  PRESALE_PROGRAM_ID
);

const [VAULT_PDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('vault'), PRESALE_PDA.toBuffer()],
  PRESALE_PROGRAM_ID
);

export function getPresalePDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('presale'), OWNER_WALLET.toBuffer(), TPICKS_MINT.toBuffer()],
    PRESALE_PROGRAM_ID
  );
}

export function getVaultPDA(presalePDA: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), presalePDA.toBuffer()],
    PRESALE_PROGRAM_ID
  );
}

export function getBuyerStatePDA(presalePDA: PublicKey, buyer: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('buyer'), presalePDA.toBuffer(), buyer.toBuffer()],
    PRESALE_PROGRAM_ID
  );
}

function getReadOnlyProgram(connection: import('@solana/web3.js').Connection) {
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async <T,>(tx: T) => tx,
    signAllTransactions: async <T,>(txs: T[]) => txs,
  };
  const provider = new AnchorProvider(connection, dummyWallet as any, {
    commitment: 'confirmed',
  });
  return new Program(idl as any, provider);
}

export function usePresale() {
  const { connection } = useConnection();
  const [presale, setPresale] = useState<PresaleState | null>(null);
  const [vaultBalance, setVaultBalance] = useState<BN>(new BN(0));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchPresale = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const program = getReadOnlyProgram(connection);
      const account = await (program.account as any).presale.fetch(PRESALE_PDA);
      setPresale(account as PresaleState);

      try {
        const vaultAccount = await getAccount(connection, VAULT_PDA);
        setVaultBalance(new BN(vaultAccount.amount.toString()));
      } catch {
        setVaultBalance(new BN(0));
      }

      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch presale');
      setPresale(null);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [connection]);

  useEffect(() => {
    fetchPresale();
    const interval = setInterval(fetchPresale, 30000);
    return () => clearInterval(interval);
  }, [fetchPresale]);

  return { presale, vaultBalance, isLoading, error, refetch: fetchPresale, presalePDA: PRESALE_PDA };
}

export function useBuyerState(buyer: PublicKey | null) {
  const { connection } = useConnection();
  const [buyerState, setBuyerState] = useState<BuyerStateAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchingRef = useRef(false);
  // Stabilize the buyer key as a string to avoid re-renders from new PublicKey objects
  const buyerKey = buyer?.toBase58() ?? null;

  const fetchBuyerState = useCallback(async () => {
    if (!buyerKey) {
      setBuyerState(null);
      return;
    }
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setIsLoading(true);
    try {
      const program = getReadOnlyProgram(connection);
      const buyerPubkey = new PublicKey(buyerKey);
      const [buyerStatePDA] = getBuyerStatePDA(PRESALE_PDA, buyerPubkey);
      const account = await (program.account as any).buyerState.fetch(buyerStatePDA);
      setBuyerState(account as BuyerStateAccount);
    } catch {
      setBuyerState(null);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [connection, buyerKey]);

  useEffect(() => {
    fetchBuyerState();
    const interval = setInterval(fetchBuyerState, 30000);
    return () => clearInterval(interval);
  }, [fetchBuyerState]);

  return { buyerState, isLoading, refetch: fetchBuyerState };
}
