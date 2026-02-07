import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePresale } from '@/hooks/usePresale';
import { usePresaleActions } from '@/hooks/usePresaleActions';
import { OWNER_WALLET } from '@/config';
import { BN } from '@coral-xyz/anchor';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Shield,
  Settings,
  Coins,
  TrendingUp,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

const LAMPORTS_PER_SOL = 1_000_000_000;
const TOKEN_DEC = 1_000_000_000;
const RATE_SCALE = 100;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const AdminPage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const isOwner = Boolean(publicKey && publicKey.equals(OWNER_WALLET));
  const { presale, vaultBalance, isLoading, refetch } = usePresale();
  const {
    openSale,
    closeSale,
    finalizeSale,
    reopenFinalizeSale,
    setRate,
    setEntranceFee,
    setMaxBuy,
    fundVault,
    isPending,
  } = usePresaleActions();

  const [rateInput, setRateInput] = useState('');
  const [feeInput, setFeeInput] = useState('');
  const [maxBuyInput, setMaxBuyInput] = useState('');
  const [fundInput, setFundInput] = useState('');

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Shield className="w-12 h-12 text-ink-muted" />
        <h2 className="font-display text-display-sm text-ink">Admin Panel</h2>
        <p className="text-body text-ink-muted">Connect your wallet to access admin controls.</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Lock className="w-12 h-12 text-status-error" />
        <h2 className="font-display text-display-sm text-ink">Access Denied</h2>
        <p className="text-body text-ink-muted">Only the presale owner can access this page.</p>
      </div>
    );
  }

  if (isLoading || !presale) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-body text-ink-muted">Loading presale data...</p>
      </div>
    );
  }

  const solRaised = new BN(presale.lamportsRaised).toNumber() / LAMPORTS_PER_SOL;
  const tokensSold = new BN(presale.tokensSold).div(new BN(TOKEN_DEC)).toNumber();
  const rate = new BN(presale.rate).toNumber() / RATE_SCALE;
  const entranceFee = new BN(presale.entranceFee).toNumber() / LAMPORTS_PER_SOL;
  const maxBuyVal = new BN(presale.maxBuy).toNumber() / LAMPORTS_PER_SOL;
  const hardCap = new BN(presale.hardCap).toNumber() / LAMPORTS_PER_SOL;
  const softCap = new BN(presale.softCap).toNumber() / LAMPORTS_PER_SOL;
  const vaultTokens = vaultBalance.div(new BN(TOKEN_DEC)).toNumber();

  const saleStatus = presale.finalizeStatus
    ? 'Finalized'
    : presale.statusIco
    ? 'Live'
    : 'Closed';

  const handleAction = async (action: () => Promise<any>) => {
    try {
      await action();
      setTimeout(refetch, 2000);
    } catch {
      // Error already handled by hook toasts
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.section variants={itemVariants} className="space-y-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
          <h1 className="font-display text-xl sm:text-display-md md:text-display-lg text-ink">Admin Panel</h1>
          <Badge variant={saleStatus === 'Live' ? 'live' : 'closed'} pulse={saleStatus === 'Live'}>
            {saleStatus}
          </Badge>
        </div>
        <p className="text-body text-ink-muted">Manage your TPICKS presale</p>
      </motion.section>

      {/* Stats Overview */}
      <motion.section variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'SOL Raised', value: `${solRaised.toFixed(4)} SOL`, icon: TrendingUp },
            { label: 'Tokens Sold', value: `${tokensSold.toLocaleString()} TPICKS`, icon: Coins },
            { label: 'Vault Balance', value: `${vaultTokens.toLocaleString()} TPICKS`, icon: Coins },
            { label: 'Current Rate', value: `${rate} TPICKS/SOL`, icon: Settings },
          ].map((stat, idx) => (
            <div key={idx} className="stat-card !p-4 sm:p-5 text-center">
              <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent mx-auto mb-2" />
              <p className="text-sm sm:text-body font-medium text-ink truncate">{stat.value}</p>
              <p className="text-xs sm:text-body-sm text-ink-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Sale Controls */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-6">
          <h2 className="font-display text-lg sm:text-display-sm text-ink flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent" />
            Sale Controls
          </h2>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => handleAction(openSale)}
                disabled={isPending || presale.statusIco}
                className="btn-primary flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Open Sale
              </button>
              <button
                onClick={() => handleAction(closeSale)}
                disabled={isPending || !presale.statusIco}
                className="btn-secondary flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Close Sale
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => handleAction(finalizeSale)}
                disabled={isPending || presale.finalizeStatus}
                className="btn-primary flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Finalize
              </button>
              <button
                onClick={() => handleAction(reopenFinalizeSale)}
                disabled={isPending || !presale.finalizeStatus}
                className="btn-secondary flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Reopen
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2 text-xs sm:text-body-sm text-ink-muted">
            <p>Hard Cap: {hardCap.toFixed(2)} SOL | Soft Cap: {softCap.toFixed(2)} SOL</p>
            <p>Entrance Fee: {entranceFee.toFixed(4)} SOL | Max Buy: {maxBuyVal.toFixed(2)} SOL</p>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-6">
          <h2 className="font-display text-lg sm:text-display-sm text-ink flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent" />
            Settings
          </h2>

          {/* Set Rate */}
          <div className="space-y-2">
            <label className="text-body-sm text-ink-muted font-medium">
              Rate (tokens per SOL)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                placeholder={`Current: ${rate}`}
                className="input-field flex-1"
              />
              <button
                onClick={() => {
                  const val = parseFloat(rateInput);
                  if (val > 0) handleAction(() => setRate(Math.round(val * RATE_SCALE)));
                }}
                disabled={isPending || !rateInput}
                className="btn-primary"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set'}
              </button>
            </div>
          </div>

          {/* Set Entrance Fee */}
          <div className="space-y-2">
            <label className="text-body-sm text-ink-muted font-medium">
              Entrance Fee (SOL)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.001"
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                placeholder={`Current: ${entranceFee.toFixed(4)}`}
                className="input-field flex-1"
              />
              <button
                onClick={() => {
                  const val = parseFloat(feeInput);
                  if (val > 0) handleAction(() => setEntranceFee(Math.floor(val * LAMPORTS_PER_SOL)));
                }}
                disabled={isPending || !feeInput}
                className="btn-primary"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set'}
              </button>
            </div>
          </div>

          {/* Set Max Buy */}
          <div className="space-y-2">
            <label className="text-body-sm text-ink-muted font-medium">
              Max Buy (SOL)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={maxBuyInput}
                onChange={(e) => setMaxBuyInput(e.target.value)}
                placeholder={`Current: ${maxBuyVal.toFixed(2)}`}
                className="input-field flex-1"
              />
              <button
                onClick={() => {
                  const val = parseFloat(maxBuyInput);
                  if (val > 0) handleAction(() => setMaxBuy(Math.floor(val * LAMPORTS_PER_SOL)));
                }}
                disabled={isPending || !maxBuyInput}
                className="btn-primary"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fund Vault */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
        <h2 className="font-display text-lg sm:text-display-sm text-ink flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent" />
          Fund Vault
        </h2>
        <p className="text-body-sm text-ink-muted">
          Transfer TPICKS tokens from your wallet to the presale vault.
          Current vault balance: {vaultTokens.toLocaleString()} TPICKS
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            step="1"
            value={fundInput}
            onChange={(e) => setFundInput(e.target.value)}
            placeholder="Amount of TPICKS tokens"
            className="input-field flex-1"
          />
          <button
            onClick={() => {
              const val = parseFloat(fundInput);
              if (val > 0) {
                const amount = Math.floor(val * TOKEN_DEC);
                handleAction(() => fundVault(amount));
                setFundInput('');
              }
            }}
            disabled={isPending || !fundInput}
            className="btn-primary"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </span>
            ) : (
              'Fund Vault'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminPage;
