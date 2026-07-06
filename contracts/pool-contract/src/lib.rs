#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};
use member_registry::MemberRegistryClient;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Token,              // Address
    Registry,           // Address
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
    pub fn initialize(env: Env, token: Address, registry: Address) {
        if env.storage().instance().has(&DataKey::Token) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Registry, &registry);
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
        let local_recipient = members.get(index).unwrap();

        // Get expected recipient from MemberRegistry
        let registry_address: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        let registry_client = MemberRegistryClient::new(&env, &registry_address);
        let registry_recipient = registry_client.get_next_recipient(&cycle_id);

        if local_recipient != registry_recipient {
            panic!("recipient mismatch");
        }

        // Transfer funds
        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &local_recipient, &payout_amount);

        // Mark as paid in MemberRegistry
        registry_client.mark_paid(&cycle_id, &local_recipient);

        // Mark cycle paid out locally
        env.storage().persistent().set(&paid_key, &true);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{vec, Env, Address};
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::token::{Client as TokenClient, StellarAssetClient};

    #[test]
    fn test_successful_cycle() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let sac = env.register_stellar_asset_contract_v2(admin);
        let token_address = sac.address();
        let sac_client = StellarAssetClient::new(&env, &token_address);
        let token_client = TokenClient::new(&env, &token_address);

        let registry_id = env.register(member_registry::MemberRegistry, ());
        let registry_client = member_registry::MemberRegistryClient::new(&env, &registry_id);

        let contract_id = env.register(PoolContract, ());
        let client = PoolContractClient::new(&env, &contract_id);

        client.initialize(&token_address, &registry_id);

        let members = vec![
            &env,
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        ];

        registry_client.register_members(&members);
        client.create_circle(&members, &100, &10);

        for m in members.iter() {
            sac_client.mint(&m, &100);
            client.contribute(&m, &0);
            assert_eq!(token_client.balance(&m), 0);
        }

        client.payout(&0);

        assert_eq!(token_client.balance(&members.get(0).unwrap()), 300);
        assert_eq!(token_client.balance(&members.get(1).unwrap()), 0);
        assert_eq!(token_client.balance(&members.get(2).unwrap()), 0);
    }

    #[test]
    #[should_panic(expected = "not all members contributed")]
    fn test_reject_payout_missing_contributions() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let sac = env.register_stellar_asset_contract_v2(admin);
        let token_address = sac.address();
        let sac_client = StellarAssetClient::new(&env, &token_address);

        let registry_id = env.register(member_registry::MemberRegistry, ());
        let registry_client = member_registry::MemberRegistryClient::new(&env, &registry_id);

        let contract_id = env.register(PoolContract, ());
        let client = PoolContractClient::new(&env, &contract_id);

        client.initialize(&token_address, &registry_id);

        let members = vec![
            &env,
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        ];

        registry_client.register_members(&members);
        client.create_circle(&members, &100, &10);

        sac_client.mint(&members.get(0).unwrap(), &100);
        client.contribute(&members.get(0).unwrap(), &0);

        sac_client.mint(&members.get(1).unwrap(), &100);
        client.contribute(&members.get(1).unwrap(), &0);

        client.payout(&0);
    }

    #[test]
    fn test_correct_payout_amount() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let sac = env.register_stellar_asset_contract_v2(admin);
        let token_address = sac.address();
        let sac_client = StellarAssetClient::new(&env, &token_address);
        let token_client = TokenClient::new(&env, &token_address);

        let registry_id = env.register(member_registry::MemberRegistry, ());
        let registry_client = member_registry::MemberRegistryClient::new(&env, &registry_id);

        let contract_id = env.register(PoolContract, ());
        let client = PoolContractClient::new(&env, &contract_id);

        client.initialize(&token_address, &registry_id);

        let members = vec![
            &env,
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        ];

        registry_client.register_members(&members);
        client.create_circle(&members, &150, &10);

        for m in members.iter() {
            sac_client.mint(&m, &150);
            client.contribute(&m, &1);
        }

        client.payout(&1);

        assert_eq!(token_client.balance(&members.get(1).unwrap()), 600);
        assert_eq!(token_client.balance(&members.get(0).unwrap()), 0);
        assert_eq!(token_client.balance(&members.get(2).unwrap()), 0);
        assert_eq!(token_client.balance(&members.get(3).unwrap()), 0);
    }

    #[test]
    #[should_panic(expected = "recipient mismatch")]
    fn test_reject_payout_recipient_mismatch() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let sac = env.register_stellar_asset_contract_v2(admin);
        let token_address = sac.address();
        let sac_client = StellarAssetClient::new(&env, &token_address);

        let registry_id = env.register(member_registry::MemberRegistry, ());
        let registry_client = member_registry::MemberRegistryClient::new(&env, &registry_id);

        let contract_id = env.register(PoolContract, ());
        let client = PoolContractClient::new(&env, &contract_id);

        client.initialize(&token_address, &registry_id);

        let member_a = Address::generate(&env);
        let member_b = Address::generate(&env);
        let member_c = Address::generate(&env);

        let pool_members = vec![&env, member_a.clone(), member_b.clone(), member_c.clone()];
        let registry_members = vec![&env, member_b.clone(), member_c.clone(), member_a.clone()];

        registry_client.register_members(&registry_members);
        client.create_circle(&pool_members, &100, &10);

        for m in pool_members.iter() {
            sac_client.mint(&m, &100);
            client.contribute(&m, &0);
        }

        client.payout(&0);
    }
}

