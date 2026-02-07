import { useMemo } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import AppRoutes from './AppRoutes';
import { RPC_URL } from './config';

import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();

function App() {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  fontFamily: '"Space Mono", "JetBrains Mono", monospace',
                },
              }}
            />
            <Router>
              <AppRoutes />
            </Router>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
