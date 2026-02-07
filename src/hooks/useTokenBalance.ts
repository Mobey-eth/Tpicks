import { useEffect, useState, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { TPICKS_MINT } from '../config';

export function useTokenBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokenBalance, setTokenBalance] = useState<BN>(new BN(0));
  const [solBalance, setSolBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fetchingRef = useRef(false);
  // Stabilize the key as a string so useCallback deps don't change on every render
  const walletKey = publicKey?.toBase58() ?? null;

  const fetchBalances = useCallback(async () => {
    if (!walletKey) {
      setTokenBalance(new BN(0));
      setSolBalance(0);
      return;
    }
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    setIsLoading(true);
    try {
      const pk = new PublicKey(walletKey);
      const sol = await connection.getBalance(pk);
      setSolBalance(sol / LAMPORTS_PER_SOL);

      try {
        const ata = await getAssociatedTokenAddress(TPICKS_MINT, pk);
        const account = await getAccount(connection, ata);
        setTokenBalance(new BN(account.amount.toString()));
      } catch {
        setTokenBalance(new BN(0));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [connection, walletKey]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return { tokenBalance, solBalance, isLoading, refetch: fetchBalances };
}
