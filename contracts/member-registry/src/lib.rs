#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Members,
    Paid(u64, Address),
    Pool,
    CompletedCycles(Address),
}

#[contract]
pub struct MemberRegistry;

#[contractimpl]
impl MemberRegistry {
    pub fn configure_pool(env: Env, pool: Address) {
        pool.require_auth();
        if let Some(existing) = env.storage().instance().get::<_, Address>(&DataKey::Pool) {
            if existing != pool { panic!("already initialized"); }
            return;
        }
        env.storage().instance().set(&DataKey::Pool, &pool);
    }

    pub fn register_members(env: Env, members: Vec<Address>) {
        if env.storage().instance().has(&DataKey::Members) {
            panic!("members already registered");
        }
        if members.len() == 0 {
            panic!("must have members");
        }
        env.storage().instance().set(&DataKey::Members, &members);
    }

    pub fn get_next_recipient(env: Env, cycle_id: u64) -> Address {
        let members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();
        let index = (cycle_id % (members.len() as u64)) as u32;
        members.get(index).unwrap()
    }

    pub fn mark_paid(env: Env, cycle_id: u64, member: Address) {
        let key = DataKey::Paid(cycle_id, member);
        env.storage().persistent().set(&key, &true);
    }

    pub fn record_payment(env: Env, member: Address) {
        let Some(pool) = env.storage().instance().get::<_, Address>(&DataKey::Pool) else { return; };
        pool.require_auth();
        let key = DataKey::CompletedCycles(member);
        let completed = env.storage().persistent().get(&key).unwrap_or(0u32);
        env.storage().persistent().set(&key, &(completed + 1));
    }

    pub fn get_completed_cycles(env: Env, member: Address) -> u32 {
        env.storage().persistent().get(&DataKey::CompletedCycles(member)).unwrap_or(0)
    }

    pub fn get_credit_score(env: Env, member: Address) -> u32 {
        100.min(Self::get_completed_cycles(env, member).saturating_mul(10))
    }

    pub fn remove_member(env: Env, caller: Address) {
        caller.require_auth();
        let mut members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();
        let index = members.first_index_of(&caller);
        if index.is_none() {
            panic!("not a member");
        }
        members.remove(index.unwrap());
        env.storage().instance().set(&DataKey::Members, &members);
    }

    pub fn reset_registry(env: Env, caller: Address) {
        caller.require_auth();
        env.storage().instance().remove(&DataKey::Members);
    }
}
