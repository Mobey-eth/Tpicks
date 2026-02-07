import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Wallet } from 'lucide-react';
import { OWNER_WALLET } from '@/config';
import logoImg from '@/assets/Tokenpicks.png';

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { publicKey, connected, disconnect } = useWallet();
  const isOwner = Boolean(publicKey && publicKey.equals(OWNER_WALLET));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/buy', label: 'Buy' },
    ...(isOwner ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  const truncatedAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null;

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 py-3 sm:py-5 border-b border-transparent transition-colors duration-300 ${
        scrolled
          ? 'bg-canvas/80 backdrop-blur-xl border-border'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <img src={logoImg} alt="TokenPicks" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl" />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-ink">
            Token<span className="font-extrabold">Picks</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="relative px-4 py-2 text-body-sm font-medium transition-colors duration-300"
            >
              <span
                className={`relative z-10 ${
                  location.pathname === item.path
                    ? 'text-ink'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {item.label}
              </span>
              <AnimatePresence>
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="nav-indicator"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 bg-canvas-alt rounded-lg"
                  />
                )}
              </AnimatePresence>
            </Link>
          ))}
        </div>

        {/* Right side: Wallet + Mobile menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {connected && (
            <span className="hidden sm:inline text-body-sm text-ink-muted px-3 py-1 rounded-full bg-accent-muted">
              Devnet
            </span>
          )}
          {/* Desktop: full wallet button */}
          <div className="hidden md:block">
            <WalletMultiButton />
          </div>
          {/* Mobile: icon-only connect button */}
          <div className="md:hidden">
            {!connected ? (
              <WalletMultiButton />
            ) : (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-9 h-9 rounded-full bg-accent-muted text-accent flex items-center justify-center"
                aria-label="Wallet"
              >
                <Wallet className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden btn-ghost p-1.5 sm:p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-b border-border bg-canvas/95 backdrop-blur-xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-4 py-3 rounded-xl text-body font-medium transition-colors duration-200 ${
                    location.pathname === item.path
                      ? 'bg-canvas-alt text-ink'
                      : 'text-ink-muted hover:text-ink hover:bg-canvas-alt/50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Wallet info in drawer */}
              {connected && truncatedAddress && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-accent" />
                      <span className="text-body-sm text-ink font-mono">{truncatedAddress}</span>
                    </div>
                    <span className="text-[0.65rem] text-ink-muted px-2 py-0.5 rounded-full bg-accent-muted">
                      Devnet
                    </span>
                  </div>
                  <button
                    onClick={() => { disconnect(); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-3 rounded-xl text-body font-medium text-status-error hover:bg-status-error-bg transition-colors duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
