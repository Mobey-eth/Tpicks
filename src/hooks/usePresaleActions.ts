import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createTransferInstruction,
} from '@solana/spl-token';
import { toast } from 'sonner';
import { TPICKS_MINT, OWNER_WALLET } from '../config';
import { getPresalePDA, getVaultPDA, getBuyerStatePDA } from './usePresale';
import idl from '../idl/presale.json';

function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  if (!wallet.publicKey || !wallet.signTransaction) return null;

  const provider = new AnchorProvider(
    connection,
    wallet as any,
    { commitment: 'confirmed' }
  );

  return new Program(idl as any, provider);
}

export function usePresaleActions() {
  const program = useAnchorProgram();
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isPending, setIsPending] = useState(false);

  const [presalePDA] = getPresalePDA();
  const [vaultPDA] = getVaultPDA(presalePDA);

  // Helper to call program methods with accounts (avoids TS deep instantiation errors)
  const callMethod = async (
    methodName: string,
    args: any[],
    accounts: Record<string, any>
  ): Promise<string> => {
    if (!program) throw new Error('Program not initialized');
    const method = (program.methods as any)[methodName](...args);
    return await method.accounts(accounts).rpc();
  };

  const buy = useCallback(async (lamports: number) => {
    if (!program || !wallet.publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsPending(true);
    try {
      const buyer = wallet.publicKey;
      const [buyerStatePDA] = getBuyerStatePDA(presalePDA, buyer);
      const beneficiaryToken = await getAssociatedTokenAddress(TPICKS_MINT, buyer);

      const tx = await callMethod('buy', [new BN(lamports)], {
        buyer,
        beneficiary: buyer,
        presale: presalePDA,
        tokenMint: TPICKS_MINT,
        tokenVault: vaultPDA,
        beneficiaryToken,
        buyerState: buyerStatePDA,
        wallet: OWNER_WALLET,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      });

      toast.success('Purchase successful!', { description: `TX: ${tx.slice(0, 8)}...` });
      return tx;
    } catch (e: any) {
      const msg = e.message || 'Transaction failed';
      toast.error('Purchase failed', { description: msg.slice(0, 120) });
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [program, wallet.publicKey, presalePDA, vaultPDA]);

  const openSale = useCallback(async () => {
    if (!program || !wallet.publicKey) return;
    setIsPending(true);
    try {
      const tx = await callMethod('openSale', [], {
        owner: wallet.publicKey,
        presale: presalePDA,
        tokenVault: vaultPDA,
      });
      toast.success('Sale opened!');
      return tx;
    } catch (e: any) {
      toast.error('Failed to open sale', { description: e.message?.slice(0, 120) });
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [program, wallet.publicKey, presalePDA, vaultPDA]);

  const closeSale = useCallback(async () => {
    if (!program || !wallet.publicKey) return;
    setIsPending(true);
    try {
      const tx = await callMethod('closeSale', [], {
        owner: wallet.publicKey,
        presale: presalePDA,
      });
      toast.success('Sale closed!');
      return tx;
    } catch (e: any) {
      toast.error('Failed to close sale', { description: e.message?.slice(0, 120) });
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [program, wallet.publicKey, presalePDA]);

  const finalizeSale = useCallback(async () => {
    if (!program || !wallet.publicKey) return;
    setIsPending(true);
    try {
      const destination = await getAssociatedTokenAddress(TPICKS_MINT, wallet.publicKey);
      const tx = await callMethod('finalizeSale', [], {
        owner: wallet.publicKey,
        presale: presalePDA,
        tokenVault: vaultPDA,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
      });
      toast.success('Sale finalized!');
      return tx;
    } catch (e: any) {
      toast.error('Failed to finalize', { description: e.message?.slice(0, 120) });
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [program, wallet.publicKey, presalePDA, vaultPDA]);

  const reopenFinalizeSale = useCallback(async () => {
    if (!program || !wallet.publicKey) return;
    setIsPending(true);
    try {
      const tx = await callMethod('reopenFinalizeSale', [], {
        owner: wallet.publicKey,
        presale: presalePDA,
      });
      toast.success('Finalize status reopened!');
      return tx;
    } catch (e: any) {
      toast.error('Failed to reopen finalize', { description: e.message?.slice(0, 120) });
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [program, wallet.publicKey, presalePDA]);

  const setRate = useCallback(async (rate: number) => {
    if (!program || !wallet.publicKey) return;
    setIsPending(true);
    try {
      const tx = await callMethod('setRate', [new BN(rate)], {
        owner: wallet.publicKey,
        presale: presalePDA,
      });
      toast.success(`Rate set to ${rate}`);
      return tx;
    } catch (e: any) {
      toast.error('Failed to set rate', { description: e.message?.slice(0, 120) });
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [program, wallet.publicKey, presalePDA]);

  const setEntranceFee = useCallback(async (fee: number) => {
    if (!program || !wallet.publicKey) return;
    setIsPending(true);
    try {
      const tx = await callMethod('setEntranceFee', [new BN(fee)], {
        owner: wallet.publicKey,
        presale: presalePDA,
      });
      toast.success('Entrance fee updated');
      return tx;
    } catch (e: any) {
      toast.error('Failed to set entrance fee', { description: e.message?.slice(0, 120) });
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [program, wallet.publicKey, presalePDA]);

  const setMaxBuy = useCallback(async (maxBuy: number) => {
    if (!program || !wallet.publicKey) return;
    setIsPending(true);
    try {
      const tx = await callMethod('setMaxBuy', [new BN(maxBuy)], {
        owner: wallet.publicKey,
        presale: presalePDA,
      });
      toast.success('Max buy updated');
      return tx;
    } catch (e: any) {
      toast.error('Failed to set max buy', { description: e.message?.slice(0, 120) });
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [program, wallet.publicKey, presalePDA]);

  const fundVault = useCallback(async (amount: number) => {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    setIsPending(true);
    try {
      const ownerATA = await getAssociatedTokenAddress(TPICKS_MINT, wallet.publicKey);
      const tx = new Transaction();

      tx.add(
        createTransferInstruction(
          ownerATA,
          vaultPDA,
          wallet.publicKey,
          amount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, 'confirmed');

      toast.success('Vault funded!', { description: `TX: ${sig.slice(0, 8)}...` });
      return sig;
    } catch (e: any) {
      toast.error('Failed to fund vault', { description: e.message?.slice(0, 120) });
      throw e;
    } finally {
      setIsPending(false);
    }
  }, [wallet, connection, vaultPDA]);

  return {
    buy,
    openSale,
    closeSale,
    finalizeSale,
    reopenFinalizeSale,
    setRate,
    setEntranceFee,
    setMaxBuy,
    fundVault,
    isPending,
  };
}
