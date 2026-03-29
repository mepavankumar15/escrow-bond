use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, CloseAccount};

use crate::state::EscrowState;
use crate::errors::EscrowError;

// Either party can cancel after expiry.
// We just need the signer to be either maker or taker.
#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut)]
    pub signer: Signer<'info>, 

    #[account(mut, address = escrow_state.maker)]
    /// CHECK: Safe, just returning the rent lamports
    pub maker: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"escrow", escrow_state.maker.as_ref(), escrow_state.seed.to_le_bytes().as_ref()],
        bump = escrow_state.bump,
        close = maker
    )]
    pub escrow_state: Account<'info, EscrowState>,

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
        constraint = maker_token_account_a.mint == escrow_state.mint_a,
        constraint = maker_token_account_a.owner == maker.key()
    )]
    pub maker_token_account_a: Account<'info, TokenAccount>,

    /// CHECK: We manually verify this if taker deposited
    #[account(mut)]
    pub taker_token_account_b: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
    let escrow_state = &ctx.accounts.escrow_state;

    // Must be expired
    let clock = Clock::get()?;
    require!(clock.unix_timestamp > escrow_state.expiry, EscrowError::EscrowNotExpired);

    // Signer must be maker or taker
    require!(
        ctx.accounts.signer.key() == escrow_state.maker || ctx.accounts.signer.key() == escrow_state.taker,
        EscrowError::Unauthorized
    );

    let maker_key = escrow_state.maker;
    let seed_bytes = escrow_state.seed.to_le_bytes();
    let bump = escrow_state.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"escrow",
        maker_key.as_ref(),
        seed_bytes.as_ref(),
        &[bump],
    ]];

    // Return Maker's tokens if they deposited
    if escrow_state.maker_deposited && ctx.accounts.vault_a.amount > 0 {
        let cpi_accounts_a = Transfer {
            from: ctx.accounts.vault_a.to_account_info(),
            to: ctx.accounts.maker_token_account_a.to_account_info(),
            authority: escrow_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_a = CpiContext::new_with_signer(cpi_program, cpi_accounts_a, signer_seeds);
        token::transfer(cpi_ctx_a, ctx.accounts.vault_a.amount)?;
    }

    // Return Taker's tokens if they deposited
    if escrow_state.taker_deposited && ctx.accounts.vault_b.amount > 0 {
        // We must deserialize and verify taker_token_account_b manually to avoid Context lifetime errors
        let data = ctx.accounts.taker_token_account_b.try_borrow_data()?;
        let taker_ta = TokenAccount::try_deserialize(&mut &data[..])?;
        require_keys_eq!(taker_ta.owner, escrow_state.taker);
        require_keys_eq!(taker_ta.mint, escrow_state.mint_b);

        let cpi_accounts_b = Transfer {
            from: ctx.accounts.vault_b.to_account_info(),
            to: ctx.accounts.taker_token_account_b.to_account_info(),
            authority: escrow_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx_b = CpiContext::new_with_signer(cpi_program, cpi_accounts_b, signer_seeds);
        token::transfer(cpi_ctx_b, ctx.accounts.vault_b.amount)?;
    }

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
