use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::state::EscrowState;

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    /// CHECK: Safe because it's only used to store the taker's pubkey in the state.
    pub taker: UncheckedAccount<'info>,

    pub mint_a: Account<'info, Mint>,
    pub mint_b: Account<'info, Mint>,

    #[account(
        mut,
        constraint = maker_token_account_a.mint == mint_a.key(),
        constraint = maker_token_account_a.owner == maker.key()
    )]
    pub maker_token_account_a: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = maker,
        seeds = [b"vault_a", escrow_state.key().as_ref()],
        bump,
        token::mint = mint_a,
        token::authority = escrow_state,
    )]
    pub vault_a: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = maker,
        seeds = [b"vault_b", escrow_state.key().as_ref()],
        bump,
        token::mint = mint_b,
        token::authority = escrow_state,
    )]
    pub vault_b: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = maker,
        space = EscrowState::INIT_SPACE,
        seeds = [b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow_state: Account<'info, EscrowState>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn initialize_escrow(
    ctx: Context<InitializeEscrow>,
    seed: u64,
    deposit_amount: u64,
    expected_amount: u64,
    expiry: i64,
) -> Result<()> {
    // 1. Initialize Escrow State
    let escrow_state = &mut ctx.accounts.escrow_state;
    escrow_state.seed = seed;
    escrow_state.maker = ctx.accounts.maker.key();
    escrow_state.taker = ctx.accounts.taker.key();
    escrow_state.mint_a = ctx.accounts.mint_a.key();
    escrow_state.mint_b = ctx.accounts.mint_b.key();
    escrow_state.expected_amount = expected_amount;
    escrow_state.expiry = expiry;
    escrow_state.maker_deposited = true;
    escrow_state.taker_deposited = false;
    escrow_state.bump = ctx.bumps.escrow_state;

    // 2. Transfer tokens from maker to vault_a
    let cpi_accounts = Transfer {
        from: ctx.accounts.maker_token_account_a.to_account_info(),
        to: ctx.accounts.vault_a.to_account_info(),
        authority: ctx.accounts.maker.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, deposit_amount)?;

    Ok(())
}
