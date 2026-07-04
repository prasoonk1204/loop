#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Token,              // Address
    Members,            // Vec<Address>
    ContributionAmount, // i128
    CycleLength,        // u64
    Contributed(u64, Address), // bool
    CyclePaid(u64),     // bool
}

#[contract]
pub struct PoolContract;

#[contractimpl]
impl PoolContract {
    pub fn initialize(env: Env, token: Address) {
        if env.storage().instance().has(&DataKey::Token) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Token, &token);
    }

    pub fn create_circle(
        env: Env,
        members: Vec<Address>,
        contribution_amount: i128,
        cycle_length: u64,
    ) {
        if !env.storage().instance().has(&DataKey::Token) {
            panic!("not initialized");
        }
        if env.storage().instance().has(&DataKey::Members) {
            panic!("circle already created");
        }
        if contribution_amount <= 0 {
            panic!("contribution amount must be positive");
        }
        if members.len() == 0 {
            panic!("must have members");
        }

        env.storage().instance().set(&DataKey::Members, &members);
        env.storage()
            .instance()
            .set(&DataKey::ContributionAmount, &contribution_amount);
        env.storage()
            .instance()
            .set(&DataKey::CycleLength, &cycle_length);
    }

    pub fn contribute(_env: Env, _member: Address, _cycle_id: u64) {
        unimplemented!()
    }

    pub fn payout(_env: Env, _cycle_id: u64) {
        unimplemented!()
    }
}

