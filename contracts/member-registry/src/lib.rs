#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Members,
    Paid(u64, Address),
}

#[contract]
pub struct MemberRegistry;

#[contractimpl]
impl MemberRegistry {
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
}
