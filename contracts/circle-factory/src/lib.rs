#![no_std]

use member_registry::MemberRegistryClient;
use pool_contract::PoolContractClient;
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, BytesN, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub struct Circle {
    pub pool: Address,
    pub registry: Address,
    pub creator: Address,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Token,
    PoolWasm,
    RegistryWasm,
    NextId,
    Circles,
}

#[contract]
pub struct CircleFactory;

#[contractimpl]
impl CircleFactory {
    pub fn setup(
        env: Env,
        token: Address,
        pool_wasm: soroban_sdk::BytesN<32>,
        registry_wasm: soroban_sdk::BytesN<32>,
    ) {
        if env.storage().instance().has(&DataKey::Token) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::PoolWasm, &pool_wasm);
        env.storage().instance().set(&DataKey::RegistryWasm, &registry_wasm);
        env.storage().instance().set(&DataKey::NextId, &0u32);
        env.storage().instance().set(&DataKey::Circles, &Vec::<Circle>::new(&env));
    }

    pub fn create(
        env: Env,
        creator: Address,
        members: Vec<Address>,
        contribution_amount: i128,
        cycle_length: u64,
    ) -> Address {
        creator.require_auth();
        if members.len() == 0 {
            panic!("must have members");
        }

        let id: u32 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
        let mut pool_salt = Bytes::from_slice(&env, &id.to_be_bytes());
        pool_salt.push_back(b'p');
        let mut registry_salt = Bytes::from_slice(&env, &id.to_be_bytes());
        registry_salt.push_back(b'r');

        let pool_salt = env.crypto().sha256(&pool_salt).to_bytes();
        let registry_salt = env.crypto().sha256(&registry_salt).to_bytes();
        let registry_wasm: BytesN<32> = env.storage().instance().get(&DataKey::RegistryWasm).unwrap();
        let pool_wasm: BytesN<32> = env.storage().instance().get(&DataKey::PoolWasm).unwrap();
        let registry = env.deployer().with_current_contract(registry_salt)
            .deploy_v2(registry_wasm, ());
        let pool = env.deployer().with_current_contract(pool_salt)
            .deploy_v2(pool_wasm, ());

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        PoolContractClient::new(&env, &pool).initialize(&token, &registry);
        MemberRegistryClient::new(&env, &registry).register_members(&members);
        PoolContractClient::new(&env, &pool).create_circle(&members, &contribution_amount, &cycle_length);

        let mut circles: Vec<Circle> = env.storage().instance().get(&DataKey::Circles).unwrap();
        circles.push_back(Circle { pool: pool.clone(), registry, creator });
        env.storage().instance().set(&DataKey::Circles, &circles);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        pool
    }

    pub fn get_circles(env: Env) -> Vec<Circle> {
        env.storage().instance().get(&DataKey::Circles).unwrap_or(Vec::new(&env))
    }
}
