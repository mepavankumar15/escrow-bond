use anchor_lang::prelude::*;

#[error_code]
pub enum EscrowError {
    #[msg("The escrow has already expired.")]
    EscrowExpired,
    #[msg("The escrow has not expired yet.")]
    EscrowNotExpired,
    #[msg("Both parties must have deposited to execute.")]
    NotFullyFunded,
    #[msg("This party has already deposited.")]
    AlreadyDeposited,
    #[msg("Unauthorized access.")]
    Unauthorized,
}
