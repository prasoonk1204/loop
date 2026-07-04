#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

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

    pub fn contribute(env: Env, member: Address, cycle_id: u64) {
        member.require_auth();

        let members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();
        if !members.contains(&member) {
            panic!("member not in circle");
        }

        let contribution_amount: i128 = env.storage().instance().get(&DataKey::ContributionAmount).unwrap();

        if env.storage().persistent().has(&DataKey::CyclePaid(cycle_id)) {
            panic!("cycle already paid out");
        }

        let key = DataKey::Contributed(cycle_id, member.clone());
        if env.storage().persistent().has(&key) {
            panic!("member already contributed for this cycle");
        }

        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&member, &env.current_contract_address(), &contribution_amount);

        env.storage().persistent().set(&key, &true);
    }

    pub fn payout(env: Env, cycle_id: u64) {
        let paid_key = DataKey::CyclePaid(cycle_id);
        if env.storage().persistent().has(&paid_key) {
            panic!("cycle already paid out");
        }

        let members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();

        for member in members.iter() {
            let key = DataKey::Contributed(cycle_id, member.clone());
            if !env.storage().persistent().has(&key) {
                panic!("not all members contributed");
            }
        }

        let contribution_amount: i128 = env.storage().instance().get(&DataKey::ContributionAmount).unwrap();
        let payout_amount = contribution_amount * (members.len() as i128);

        let index = (cycle_id % (members.len() as u64)) as u32;
        let recipient = members.get(index).unwrap();

        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &recipient, &payout_amount);

        env.storage().persistent().set(&paid_key, &true);
    }
}

