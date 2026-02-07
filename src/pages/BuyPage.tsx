import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePresale, useBuyerState } from '@/hooks/usePresale';
import { usePresaleActions } from '@/hooks/usePresaleActions';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { BN } from '@coral-xyz/anchor';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Target,
  Info,
  Users,
  AlertTriangle,
} from 'lucide-react';

const LAMPORTS_PER_SOL = 1_000_000_000;
const TOKEN_DECIMALS = 1_000_000_000;
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

const BuyPage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { presale, isLoading, refetch } = usePresale();
  const { buy, isPending } = usePresaleActions();
  const { buyerState, refetch: refetchBuyer } = useBuyerState(publicKey ?? null);
  const { tokenBalance, solBalance, refetch: refetchBalance } = useTokenBalance();

  const [solAmount, setSolAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const lamportsToSend = useMemo(() => {
    try {
      const val = parseFloat(solAmount);
      if (isNaN(val) || val <= 0) return 0;
      return Math.floor(val * LAMPORTS_PER_SOL);
    } catch {
      return 0;
    }
  }, [solAmount]);

  const tokensToReceive = useMemo(() => {
    if (!presale || lamportsToSend === 0) return 0;
    const rate = new BN(presale.rate).toNumber();
    return (lamportsToSend * rate) / (LAMPORTS_PER_SOL * RATE_SCALE);
  }, [presale, lamportsToSend]);

  if (isLoading || !presale) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-body text-ink-muted">Loading presale details...</p>
      </div>
    );
  }

  const solRaised = new BN(presale.lamportsRaised).toNumber() / LAMPORTS_PER_SOL;
  const hardCap = new BN(presale.hardCap).toNumber() / LAMPORTS_PER_SOL;
  const softCap = new BN(presale.softCap).toNumber() / LAMPORTS_PER_SOL;
  const entranceFee = new BN(presale.entranceFee).toNumber() / LAMPORTS_PER_SOL;
  const maxBuy = new BN(presale.maxBuy).toNumber() / LAMPORTS_PER_SOL;
  const rate = new BN(presale.rate).toNumber() / RATE_SCALE;
  const progress = hardCap > 0 ? Math.min((solRaised / hardCap) * 100, 100) : 0;

  const saleStatus = presale.finalizeStatus
    ? 'Finalized'
    : presale.statusIco
    ? 'Live'
    : 'Closed';

  const badgeVariant = saleStatus === 'Live' ? 'live' : 'closed';

  const buyerContribution = buyerState
    ? new BN(buyerState.contributedLamports).toNumber() / LAMPORTS_PER_SOL
    : 0;
  const buyerTokens = buyerState
    ? new BN(buyerState.tokensPurchased).div(new BN(TOKEN_DECIMALS)).toNumber()
    : 0;

  const handleBuy = async () => {
    if (lamportsToSend === 0) return;
    setError(null);
    try {
      await buy(lamportsToSend);
      setSolAmount('');
      setTimeout(() => {
        refetch();
        refetchBuyer();
        refetchBalance();
      }, 2000);
    } catch (e: any) {
      setError(e.message || 'Transaction failed');
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 sm:space-y-8"
    >
      {/* Header */}
      <motion.section variants={itemVariants} className="space-y-1 sm:space-y-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h1 className="font-display text-xl sm:text-display-md md:text-display-lg text-ink">TPICKS Presale</h1>
          <Badge variant={badgeVariant} pulse={saleStatus === 'Live'}>
            {saleStatus}
          </Badge>
        </div>
        <p className="text-body-sm sm:text-body text-ink-muted">Contribute SOL to receive TPICKS tokens</p>
      </motion.section>

      {/* Progress — full width */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
        <h2 className="font-display text-lg sm:text-display-sm text-ink">Sale Progress</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm sm:text-body">
            <span className="text-ink-muted">Raised</span>
            <span className="text-ink font-medium">
              {solRaised.toFixed(4)} SOL / {hardCap.toFixed(2)} SOL
            </span>
          </div>
          <div className="w-full h-3 sm:h-4 bg-ink/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs sm:text-body-sm text-ink-muted">
            <span>{progress.toFixed(1)}% filled</span>
            <span>Soft Cap: {softCap.toFixed(2)} SOL</span>
          </div>
        </div>
      </motion.div>

      {/* Main content: Contribute left, Details right on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
        {/* Left column — Contribute (takes 3 of 5 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contribute Form */}
          {saleStatus === 'Live' && connected && (() => {
            const effectiveMax = Math.min(maxBuy, Math.max(solBalance - 0.01, 0));
            const sliderMin = entranceFee;
            const sliderMax = Math.max(effectiveMax, sliderMin);
            const solVal = parseFloat(solAmount) || 0;

            return (
              <motion.div variants={itemVariants} className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
                <h3 className="font-display text-lg sm:text-display-sm text-ink">Contribute</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-body-sm text-ink-muted font-medium mb-1 block">
                      Amount (SOL)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min={sliderMin}
                      max={sliderMax}
                      value={solAmount}
                      onChange={(e) => {
                        setError(null);
                        setSolAmount(e.target.value);
                      }}
                      placeholder="0.0"
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <input
                      type="range"
                      min={sliderMin}
                      max={sliderMax}
                      step={0.001}
                      value={solVal || sliderMin}
                      onChange={(e) => {
                        setError(null);
                        setSolAmount(parseFloat(e.target.value).toFixed(3));
                      }}
                      className="w-full accent-accent"
                    />
                    <div className="flex justify-between text-xs sm:text-body-sm text-ink-muted mt-1">
                      <span>{sliderMin.toFixed(4)} SOL</span>
                      <span>{sliderMax.toFixed(2)} SOL</span>
                    </div>
                  </div>

                  {tokensToReceive > 0 && (
                    <div className="p-3 rounded-xl bg-accent-muted text-body-sm">
                      <span className="text-ink-muted">You will receive: </span>
                      <span className="text-ink font-medium">
                        {tokensToReceive.toLocaleString()} TPICKS
                      </span>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-status-error-bg text-status-error text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <p>{error.slice(0, 200)}</p>
                    </div>
                  )}

                  <button
                    onClick={handleBuy}
                    disabled={isPending || lamportsToSend === 0}
                    className="btn-primary w-full"
                  >
                    {isPending ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Buy TPICKS'
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })()}

          {/* Connect Wallet CTA */}
          {!connected && (
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center space-y-3"
            >
              <Users className="w-8 h-8 text-accent mx-auto" />
              <p className="text-body text-ink-muted">
                Connect your wallet to participate in this presale.
              </p>
            </motion.div>
          )}

          {/* Sale not live */}
          {connected && saleStatus !== 'Live' && (
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center space-y-3"
            >
              <Info className="w-8 h-8 text-ink-muted mx-auto" />
              <p className="text-body text-ink-muted">
                {saleStatus === 'Finalized'
                  ? 'This sale has been finalized.'
                  : 'This sale is currently closed.'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Right column — Sale Details + Position + Wallet (takes 2 of 5 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sale Details */}
          <motion.div variants={itemVariants} className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
            <h2 className="font-display text-lg sm:text-display-sm text-ink">Sale Details</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Rate', value: `${rate} TPICKS/SOL`, icon: Target },
                { label: 'Hard Cap', value: `${hardCap.toFixed(2)} SOL`, icon: Target },
                { label: 'Soft Cap', value: `${softCap.toFixed(2)} SOL`, icon: Target },
                { label: 'Min Buy', value: `${entranceFee.toFixed(4)} SOL`, icon: Info },
                { label: 'Max Buy', value: `${maxBuy.toFixed(2)} SOL`, icon: Info },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 sm:p-3 rounded-xl bg-ink/[0.02]">
                  <div className="w-7 h-7 rounded-lg bg-accent-muted text-accent flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] sm:text-body-sm text-ink-muted">{item.label}</p>
                    <p className="text-xs sm:text-body-sm font-medium text-ink truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Your Position */}
          {connected && buyerState && (
            <motion.div variants={itemVariants} className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3">
              <h3 className="font-display text-lg sm:text-display-sm text-ink">Your Position</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm sm:text-body-sm">
                  <span className="text-ink-muted">Contributed</span>
                  <span className="text-ink font-medium">{buyerContribution.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between text-sm sm:text-body-sm">
                  <span className="text-ink-muted">Tokens Received</span>
                  <span className="text-ink font-medium">{buyerTokens.toLocaleString()} TPICKS</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Your Wallet */}
          {connected && (
            <motion.div variants={itemVariants} className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3">
              <h3 className="font-display text-lg sm:text-display-sm text-ink">Your Wallet</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm sm:text-body-sm">
                  <span className="text-ink-muted">SOL Balance</span>
                  <span className="text-ink font-medium">{solBalance.toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between text-sm sm:text-body-sm">
                  <span className="text-ink-muted">TPICKS Balance</span>
                  <span className="text-ink font-medium">
                    {tokenBalance.div(new BN(TOKEN_DECIMALS)).toNumber().toLocaleString()} TPICKS
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BuyPage;
