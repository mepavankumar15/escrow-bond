use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod instructions;

use crate::instructions::*;

declare_id!("86Jr9R4AcHkWDeKqKiohW7JCxm5rXJpfZTFM5g1spBk5");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        seed: u64,
        deposit_amount: u64,
        expected_amount: u64,
        expiry: i64,
    ) -> Result<()> {
        instructions::initialize_escrow(ctx, seed, deposit_amount, expected_amount, expiry)
    }

    pub fn deposit_by_taker(ctx: Context<DepositByTaker>) -> Result<()> {
        instructions::deposit_by_taker(ctx)
    }

    pub fn execute_escrow(ctx: Context<ExecuteEscrow>) -> Result<()> {
        instructions::execute_escrow(ctx)
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        instructions::cancel_escrow(ctx)
    }
}
