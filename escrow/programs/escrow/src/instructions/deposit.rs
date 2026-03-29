use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::state::EscrowState;
use crate::errors::EscrowError;

#[derive(Accounts)]
pub struct DepositByTaker<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow_state.maker.as_ref(), escrow_state.seed.to_le_bytes().as_ref()],
        bump = escrow_state.bump,
        has_one = taker
    )]
    pub escrow_state: Account<'info, EscrowState>,

    #[account(address = escrow_state.mint_b)]
    pub mint_b: Account<'info, Mint>,

    #[account(
        mut,
        constraint = taker_token_account_b.mint == mint_b.key(),
        constraint = taker_token_account_b.owner == taker.key()
    )]
    pub taker_token_account_b: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault_b", escrow_state.key().as_ref()],
        bump,
    )]
    pub vault_b: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn deposit_by_taker(ctx: Context<DepositByTaker>) -> Result<()> {
    let escrow_state = &mut ctx.accounts.escrow_state;

    // Check expiry
    let clock = Clock::get()?;
    require!(clock.unix_timestamp <= escrow_state.expiry, EscrowError::EscrowExpired);

    // Prevent double deposit
    require!(!escrow_state.taker_deposited, EscrowError::AlreadyDeposited);

    // Transfer tokens
    let cpi_accounts = Transfer {
        from: ctx.accounts.taker_token_account_b.to_account_info(),
        to: ctx.accounts.vault_b.to_account_info(),
        authority: ctx.accounts.taker.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, escrow_state.expected_amount)?;

    escrow_state.taker_deposited = true;

    Ok(())
}
