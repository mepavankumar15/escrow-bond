use anchor_lang::prelude::*;

#[account]
pub struct EscrowState {
    pub seed: u64,
    pub maker: Pubkey,
    pub taker: Pubkey,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub expected_amount: u64,
    pub expiry: i64,
    pub maker_deposited: bool,
    pub taker_deposited: bool,
    pub bump: u8,
}

impl EscrowState {
    // Space calculation for rent: discriminator + fields
    pub const INIT_SPACE: usize = 8 // account discriminator
        + 8  // u64
        + 32 // maker
        + 32 // taker
        + 32 // mint_a
        + 32 // mint_b
        + 8  // expected_amount
        + 8  // expiry
        + 1  // maker_deposited
        + 1  // taker_deposited
        + 1; // bump
}
