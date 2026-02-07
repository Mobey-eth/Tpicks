import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePresale } from '@/hooks/usePresale';
import CountUp from '@/components/ui/CountUp';
import { BN } from '@coral-xyz/anchor';
import {
  Rocket,
  Wallet,
  CheckCircle2,
  TrendingUp,
  Coins,
  ArrowRight,
  Shield,
} from 'lucide-react';
import heroImg from '@/assets/Dubai-x-TP-Robot-2.png';
import tokenCoinImg from '@/assets/TokenPicks-2.png';
import mobileAppImg from '@/assets/TokenPicks-Mobile-2.png';

const LAMPORTS_PER_SOL = 1_000_000_000;
const TOKEN_DECIMALS = 1_000_000_000;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

const HomePage: React.FC = () => {
  const { connected } = useWallet();
  const { presale, isLoading } = usePresale();

  const solRaised = presale
    ? new BN(presale.lamportsRaised).toNumber() / LAMPORTS_PER_SOL
    : 0;
  const tokensSold = presale
    ? new BN(presale.tokensSold).div(new BN(TOKEN_DECIMALS)).toNumber()
    : 0;
  const hardCap = presale
    ? new BN(presale.hardCap).toNumber() / LAMPORTS_PER_SOL
    : 0;
  const progress = hardCap > 0 ? Math.min((solRaised / hardCap) * 100, 100) : 0;

  const saleStatus = presale
    ? presale.finalizeStatus
      ? 'Finalized'
      : presale.statusIco
      ? 'Live'
      : 'Closed'
    : 'Loading...';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 sm:space-y-16 md:space-y-20"
    >
      {/* Hero Section */}
      <motion.section variants={itemVariants} className="pt-4 sm:pt-8 md:pt-16">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Text — left */}
          <div className="flex-1 text-center md:text-left space-y-4 sm:space-y-6">
            <h1 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-ink leading-tight">
              TokenPicks is coming to{' '}
              <span className="text-accent-gradient no-glow">Solana!</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-ink-muted max-w-xl mx-auto md:mx-0">
              Participate in the presale, contribute SOL, and receive TPICKS tokens instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Link to="/buy" className="btn-primary inline-flex items-center gap-2">
                <Rocket className="w-4 h-4" />
                Buy TPICKS
              </Link>
              {!connected && (
                <span className="text-body-sm text-ink-muted">
                  Connect your wallet to get started
                </span>
              )}
            </div>
          </div>
          {/* Hero image — right */}
          <motion.div
            className="flex-shrink-0 w-48 sm:w-64 md:w-80 lg:w-96"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={heroImg}
              alt="TokenPicks Robot"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="stat-card text-center !p-5 sm:!p-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-accent-muted text-accent mx-auto flex items-center justify-center mb-3 sm:mb-4">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="font-display text-display-sm sm:text-display-md text-ink">
              {isLoading ? (
                '...'
              ) : (
                <CountUp to={solRaised} durationMs={1400} decimals={2} suffix=" SOL" />
              )}
            </p>
            <p className="text-body-sm sm:text-body text-ink-muted mt-1">SOL Raised</p>
          </div>
          <div className="stat-card text-center !p-5 sm:!p-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-accent-muted text-accent mx-auto flex items-center justify-center mb-3 sm:mb-4">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="font-display text-display-sm sm:text-display-md text-ink">
              {isLoading ? (
                '...'
              ) : (
                <CountUp to={tokensSold} durationMs={1200} decimals={0} suffix=" TPICKS" />
              )}
            </p>
            <p className="text-body-sm sm:text-body text-ink-muted mt-1">Tokens Sold</p>
          </div>
          <div className="stat-card text-center !p-5 sm:!p-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-accent-muted text-accent mx-auto flex items-center justify-center mb-3 sm:mb-4">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="font-display text-display-sm sm:text-display-md text-ink">
              <span
                className={
                  saleStatus === 'Live'
                    ? 'text-status-live'
                    : saleStatus === 'Finalized'
                    ? 'text-ink-muted'
                    : 'text-status-closed'
                }
              >
                {saleStatus}
              </span>
            </p>
            <p className="text-body-sm sm:text-body text-ink-muted mt-1">Sale Status</p>
          </div>
        </div>
      </motion.section>

      {/* TPICKS Token Showcase */}
      <motion.section variants={itemVariants}>
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <motion.div
            className="flex-shrink-0 w-40 sm:w-52 md:w-64"
            initial={{ opacity: 0, rotate: -10 }}
            whileInView={{ opacity: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={tokenCoinImg}
              alt="TPICKS Token"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </motion.div>
          <div className="flex-1 text-center md:text-left space-y-3 sm:space-y-4">
            <h2 className="font-display text-display-sm sm:text-display-md text-ink">The TPICKS Token</h2>
            <p className="text-body-sm sm:text-body text-ink-muted max-w-lg mx-auto md:mx-0">
              TPICKS is the native utility token powering the TokenPicks ecosystem on Solana.
              Built for speed, low fees, and seamless transactions.
            </p>
            <Link to="/buy" className="btn-ghost inline-flex items-center gap-1">
              Get TPICKS <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Featured Presale Card */}
      <motion.section variants={itemVariants} className="space-y-8 sm:space-y-10">
        <div className="flex items-end justify-between">
          <div className="space-y-1 sm:space-y-2">
            <p className="text-label text-ink-faint uppercase tracking-wider">Featured</p>
            <h2 className="font-display text-display-sm sm:text-display-md text-ink">TPICKS Presale</h2>
          </div>
          <Link to="/buy" className="btn-ghost inline-flex items-center gap-1">
            Buy Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <Link to="/buy">
          <div className="project-card rounded-3xl p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-display-sm text-ink">TPICKS</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  saleStatus === 'Live'
                    ? 'bg-status-live-bg text-status-live'
                    : saleStatus === 'Finalized'
                    ? 'bg-status-closed-bg text-status-closed'
                    : 'bg-status-upcoming-bg text-status-upcoming'
                }`}
              >
                {saleStatus}
              </span>
            </div>
            <p className="text-body-sm text-ink-muted">TokenPicks Token Presale on Solana</p>
            <div className="space-y-2">
              <div className="flex justify-between text-body-sm">
                <span className="text-ink-muted">Progress</span>
                <span className="text-ink font-medium">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-ink/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-body-sm text-ink-muted">
                <span>{solRaised.toFixed(2)} SOL</span>
                <span>{hardCap.toFixed(2)} SOL</span>
              </div>
            </div>
          </div>
        </Link>
      </motion.section>

      {/* How it Works */}
      <motion.section variants={itemVariants} className="space-y-8 sm:space-y-12">
        <div className="text-center">
          <h2 className="font-display text-display-sm sm:text-display-md text-ink">How It Works</h2>
          <p className="text-body sm:text-body-lg text-ink-muted max-w-2xl mx-auto mt-3 sm:mt-4 px-2">
            Participating in the TokenPicks presale is simple and straightforward.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              step: 1,
              title: 'Connect Wallet',
              description: 'Connect your Phantom or Solflare wallet to access the TokenPicks presale.',
              icon: Wallet,
            },
            {
              step: 2,
              title: 'Contribute SOL',
              description: 'Enter the amount of SOL you want to contribute and confirm the transaction.',
              icon: Coins,
            },
            {
              step: 3,
              title: 'Receive TPICKS',
              description: 'TPICKS tokens are sent directly to your wallet at the current rate.',
              icon: CheckCircle2,
            },
          ].map((item, index) => (
            <motion.div key={index} variants={itemVariants} custom={index}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-accent-muted text-accent mx-auto flex items-center justify-center">
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-display text-display-sm text-ink">{item.title}</h3>
                <p className="text-body text-ink-muted">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Mobile App Showcase */}
      <motion.section variants={itemVariants}>
        <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
          <motion.div
            className="flex-shrink-0 w-56 sm:w-72 md:w-80"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={mobileAppImg}
              alt="TokenPicks Crypto Signals"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </motion.div>
          <div className="flex-1 text-center md:text-left space-y-3 sm:space-y-4">
            <h2 className="font-display text-display-sm sm:text-display-md text-ink">Crypto Signals</h2>
            <p className="text-body-sm sm:text-body text-ink-muted max-w-lg mx-auto md:mx-0">
              Get buy/sell signals based on data-driven analysis.
              Stay ahead of the market with real-time insights powered by TokenPicks.
            </p>
            <Link to="/buy" className="btn-primary inline-flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Join the Presale
            </Link>
          </div>
        </div>
      </motion.section>

      {/* CTA Banner */}
      <motion.section variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-gradient-to-br from-canvas-alt via-canvas to-canvas-alt p-5 sm:p-8 md:p-12">
          {/* Gradient Accent */}
          <div
            className="absolute top-0 right-0 w-1/2 h-full opacity-30"
            style={{
              background:
                'radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.35), transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-1/3 h-1/2 opacity-20"
            style={{
              background:
                'radial-gradient(ellipse at bottom left, rgba(249, 115, 22, 0.25), transparent 70%)',
            }}
          />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <h3 className="font-display text-display-sm sm:text-display-md text-ink">
                Join the TPICKS presale
                <br />
                <span className="text-[#34D399]">on Solana</span>
              </h3>
              <p className="text-body-sm sm:text-body text-ink-muted">
                Get early access to TPICKS tokens at the best rate.
                Connect your wallet and start contributing SOL today.
              </p>
            </div>
            <Link to="/buy" className="btn-primary">
              Buy TPICKS
            </Link>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default HomePage;
