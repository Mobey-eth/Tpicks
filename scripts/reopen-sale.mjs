import pkg from '@coral-xyz/anchor';
const { AnchorProvider, Program, BN } = pkg;
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';
import { fileURLToPath } from 'url';

const PRESALE_PROGRAM_ID = new PublicKey('2aBRNteWaNGAh3R79RWengDwzn8SnGVtYJeX4Wru6ejK');
const TPICKS_MINT = new PublicKey('4nVqegSXf5DsAAiUMVYHQ2NeMotcmGrzqRaD7HZF1cbM');
const RPC_URL = 'https://api.devnet.solana.com';
const TOKEN_DECIMALS = 1_000_000_000; // 10^9

// Load wallet keypair
const keypairPath = '/Users/mac/Downloads/wallet-keypair.json';
const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));
console.log('Wallet:', wallet.publicKey.toBase58());

// Load IDL
const idlPath = new URL('../src/idl/presale.json', import.meta.url);
const idl = JSON.parse(fs.readFileSync(fileURLToPath(idlPath), 'utf8'));

// Setup connection + provider
const connection = new Connection(RPC_URL, 'confirmed');
const provider = new AnchorProvider(
  connection,
  {
    publicKey: wallet.publicKey,
    signTransaction: async (tx) => { tx.partialSign(wallet); return tx; },
    signAllTransactions: async (txs) => { txs.forEach(tx => tx.partialSign(wallet)); return txs; },
  },
  { commitment: 'confirmed' }
);
const program = new Program(idl, provider);

// Derive PDAs
const [presalePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('presale'), wallet.publicKey.toBuffer(), TPICKS_MINT.toBuffer()],
  PRESALE_PROGRAM_ID
);
const [vaultPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('vault'), presalePDA.toBuffer()],
  PRESALE_PROGRAM_ID
);

console.log('Presale PDA:', presalePDA.toBase58());
console.log('Vault PDA:', vaultPDA.toBase58());

// Fetch current state
const presale = await program.account.presale.fetch(presalePDA);
console.log('\n--- Current State ---');
console.log('Owner:', presale.owner.toBase58());
console.log('Wallet:', presale.wallet.toBase58());
console.log('Status ICO:', presale.statusIco);
console.log('Finalize Status:', presale.finalizeStatus);
console.log('Rate:', presale.rate.toString());
console.log('Lamports Raised:', presale.lamportsRaised.toString());
console.log('Tokens Sold:', presale.tokensSold.toString());

// Check vault balance
let vaultBalance = BigInt(0);
try {
  const vaultAccount = await getAccount(connection, vaultPDA);
  vaultBalance = vaultAccount.amount;
  console.log('Vault TPICKS balance:', Number(vaultBalance) / TOKEN_DECIMALS);
} catch {
  console.log('Vault TPICKS balance: 0 (account not found)');
}

// Check owner's token balance
const ownerATA = await getAssociatedTokenAddress(TPICKS_MINT, wallet.publicKey);
let ownerBalance = BigInt(0);
try {
  const ownerAccount = await getAccount(connection, ownerATA);
  ownerBalance = ownerAccount.amount;
  console.log('Owner TPICKS balance:', Number(ownerBalance) / TOKEN_DECIMALS);
} catch {
  console.log('Owner TPICKS balance: 0 (account not found)');
}

// Step 1: Reopen finalize if finalized
if (presale.finalizeStatus) {
  console.log('\n>>> Calling reopen_finalize_sale...');
  const tx1 = await program.methods.reopenFinalizeSale()
    .accounts({ owner: wallet.publicKey, presale: presalePDA })
    .signers([wallet])
    .rpc();
  console.log('reopen_finalize_sale TX:', tx1);
} else {
  console.log('\nSale is not finalized, skipping reopen_finalize_sale.');
}

// Step 2: Fund vault if empty (transfer 1M TPICKS to vault)
if (vaultBalance === BigInt(0) && ownerBalance > BigInt(0)) {
  const fundAmount = Math.min(Number(ownerBalance), 1_000_000 * TOKEN_DECIMALS);
  console.log(`\n>>> Funding vault with ${fundAmount / TOKEN_DECIMALS} TPICKS...`);

  const tx = new Transaction();
  tx.add(
    createTransferInstruction(
      ownerATA,
      vaultPDA,
      wallet.publicKey,
      BigInt(fundAmount),
      [],
      TOKEN_PROGRAM_ID
    )
  );
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(wallet);

  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig, 'confirmed');
  console.log('Fund vault TX:', sig);

  // Verify
  const vaultAfterFund = await getAccount(connection, vaultPDA);
  console.log('Vault TPICKS balance after funding:', Number(vaultAfterFund.amount) / TOKEN_DECIMALS);
} else if (vaultBalance > BigInt(0)) {
  console.log('\nVault already has tokens, skipping funding.');
} else {
  console.log('\nWARNING: Vault is empty and owner has no TPICKS tokens to fund it!');
}

// Step 3: Open sale if closed
const presaleAfter = await program.account.presale.fetch(presalePDA);
if (!presaleAfter.statusIco) {
  console.log('\n>>> Calling open_sale...');
  const tx2 = await program.methods.openSale()
    .accounts({ owner: wallet.publicKey, presale: presalePDA, tokenVault: vaultPDA })
    .signers([wallet])
    .rpc();
  console.log('open_sale TX:', tx2);
} else {
  console.log('\nSale is already open, skipping open_sale.');
}

// Confirm final state
const finalState = await program.account.presale.fetch(presalePDA);
console.log('\n--- Final State ---');
console.log('Status ICO:', finalState.statusIco);
console.log('Finalize Status:', finalState.finalizeStatus);

try {
  const finalVault = await getAccount(connection, vaultPDA);
  console.log('Vault TPICKS balance:', Number(finalVault.amount) / TOKEN_DECIMALS);
} catch {
  console.log('Vault TPICKS balance: 0');
}

console.log('\nDone!');
