use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, CloseAccount};

use crate::state::EscrowState;
use crate::errors::EscrowError;

#[derive(Accounts)]
pub struct ExecuteEscrow<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(
        mut,
        address = escrow_state.maker
    )]
    /// CHECK: We only send lamports to the maker to return rent
    pub maker: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow_state.maker.as_ref(), escrow_state.seed.to_le_bytes().as_ref()],
        bump = escrow_state.bump,
        has_one = taker,
        has_one = maker,
        close = maker
    )]
    pub escrow_state: Account<'info, EscrowState>,

    #[account(address = escrow_state.mint_a)]
    pub mint_a: Account<'info, Mint>,

    #[account(address = escrow_state.mint_b)]
    pub mint_b: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"vault_a", escrow_state.key().as_ref()],
        bump
    )]
    pub vault_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"vault_b", escrow_state.key().as_ref()],
        bump
    )]
    pub vault_b: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = taker_token_account_a.mint == mint_a.key(),
        constraint = taker_token_account_a.owner == taker.key()
    )]
    pub taker_token_account_a: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = maker_token_account_b.mint == mint_b.key(),
        constraint = maker_token_account_b.owner == maker.key()
    )]
    pub maker_token_account_b: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn execute_escrow(ctx: Context<ExecuteEscrow>) -> Result<()> {
    let escrow_state = &ctx.accounts.escrow_state;

    // Check expiry
    let clock = Clock::get()?;
    require!(clock.unix_timestamp <= escrow_state.expiry, EscrowError::EscrowExpired);

    // Ensure fully funded
    require!(escrow_state.maker_deposited && escrow_state.taker_deposited, EscrowError::NotFullyFunded);

    let maker_key = escrow_state.maker;
    let seed_bytes = escrow_state.seed.to_le_bytes();
    let bump = escrow_state.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"escrow",
        maker_key.as_ref(),
        seed_bytes.as_ref(),
        &[bump],
    ]];

    // Transfer Vault A (Mint A) to Taker
    let vault_a_balance = ctx.accounts.vault_a.amount;
    let cpi_accounts_a = Transfer {
        from: ctx.accounts.vault_a.to_account_info(),
        to: ctx.accounts.taker_token_account_a.to_account_info(),
        authority: escrow_state.to_account_info(),
    };
    let cpi_program_a = ctx.accounts.token_program.to_account_info();
    let cpi_ctx_a = CpiContext::new_with_signer(cpi_program_a, cpi_accounts_a, signer_seeds);
    token::transfer(cpi_ctx_a, vault_a_balance)?;

    // Transfer Vault B (Mint B) to Maker
    let vault_b_balance = ctx.accounts.vault_b.amount;
    let cpi_accounts_b = Transfer {
        from: ctx.accounts.vault_b.to_account_info(),
        to: ctx.accounts.maker_token_account_b.to_account_info(),
        authority: escrow_state.to_account_info(),
    };
    let cpi_program_b = ctx.accounts.token_program.to_account_info();
    let cpi_ctx_b = CpiContext::new_with_signer(cpi_program_b, cpi_accounts_b, signer_seeds);
    token::transfer(cpi_ctx_b, vault_b_balance)?;

    // Close Vault A
    let cpi_close_a = CloseAccount {
        account: ctx.accounts.vault_a.to_account_info(),
        destination: ctx.accounts.maker.to_account_info(),
        authority: escrow_state.to_account_info(),
    };
    let cpi_ctx_close_a = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_close_a, signer_seeds);
    token::close_account(cpi_ctx_close_a)?;

    // Close Vault B
    let cpi_close_b = CloseAccount {
        account: ctx.accounts.vault_b.to_account_info(),
        destination: ctx.accounts.maker.to_account_info(),
        authority: escrow_state.to_account_info(),
    };
    let cpi_ctx_close_b = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_close_b, signer_seeds);
    token::close_account(cpi_ctx_close_b)?;

    Ok(())
}
