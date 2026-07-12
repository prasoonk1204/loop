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
    CircleId,           // u32
    Contributed(u32, u64, Address), // circle_id, cycle_id, member -> bool
    CyclePaid(u32, u64),     // circle_id, cycle_id -> bool
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

    fn get_circle_id(env: &Env) -> u32 {
        env.storage().instance().get(&DataKey::CircleId).unwrap_or(0)
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

        // Publish creation event
        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "circle_created"),),
            members.clone(),
        );
    }

    pub fn contribute(env: Env, member: Address, cycle_id: u64) {
        member.require_auth();

        let members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();
        if !members.contains(&member) {
            panic!("member not in circle");
        }

        let contribution_amount: i128 = env.storage().instance().get(&DataKey::ContributionAmount).unwrap();

        let circle_id = Self::get_circle_id(&env);
        let paid_key = DataKey::CyclePaid(circle_id, cycle_id);
        if env.storage().persistent().has(&paid_key) {
            panic!("cycle already paid out");
        }

        let key = DataKey::Contributed(circle_id, cycle_id, member.clone());
        if env.storage().persistent().has(&key) {
            panic!("member already contributed for this cycle");
        }

        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&member, &env.current_contract_address(), &contribution_amount);

        env.storage().persistent().set(&key, &true);

        // Publish contribution event
        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "contribute"), member.clone()),
            cycle_id,
        );
    }

    pub fn payout(env: Env, cycle_id: u64) {
        let circle_id = Self::get_circle_id(&env);
        let paid_key = DataKey::CyclePaid(circle_id, cycle_id);
        if env.storage().persistent().has(&paid_key) {
            panic!("cycle already paid out");
        }

        let members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();

        for member in members.iter() {
            let key = DataKey::Contributed(circle_id, cycle_id, member.clone());
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

        // Publish payout event
        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "payout"), local_recipient.clone()),
            cycle_id,
        );
    }

    fn get_current_cycle(env: &Env) -> u64 {
        let circle_id = Self::get_circle_id(env);
        let mut cycle_id = 0;
        while env.storage().persistent().has(&DataKey::CyclePaid(circle_id, cycle_id)) {
            cycle_id += 1;
        }
        cycle_id
    }

    pub fn leave_circle(env: Env, caller: Address) {
        caller.require_auth();

        if !env.storage().instance().has(&DataKey::Members) {
            return;
        }

        let mut members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();
        let index = members.first_index_of(&caller);
        if index.is_none() {
            panic!("not a member");
        }

        let circle_id = Self::get_circle_id(&env);
        let cycle_id = Self::get_current_cycle(&env);
        let key = DataKey::Contributed(circle_id, cycle_id, caller.clone());
        if env.storage().persistent().has(&key) {
            let contribution_amount: i128 = env.storage().instance().get(&DataKey::ContributionAmount).unwrap();
            let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
            let token_client = token::Client::new(&env, &token_address);
            token_client.transfer(&env.current_contract_address(), &caller, &contribution_amount);
            env.storage().persistent().remove(&key);
        }

        members.remove(index.unwrap());
        env.storage().instance().set(&DataKey::Members, &members);
    }

    pub fn delete_circle(env: Env, caller: Address) {
        caller.require_auth();

        if !env.storage().instance().has(&DataKey::Members) {
            return;
        }

        let members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();
        if members.len() == 0 {
            return;
        }
        if caller != members.get(0).unwrap() {
            panic!("only creator can delete");
        }

        let contribution_amount: i128 = env.storage().instance().get(&DataKey::ContributionAmount).unwrap();
        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        let circle_id = Self::get_circle_id(&env);
        let cycle_id = Self::get_current_cycle(&env);

        // Refund all contributors in the current cycle
        for member in members.iter() {
            let key = DataKey::Contributed(circle_id, cycle_id, member.clone());
            if env.storage().persistent().has(&key) {
                token_client.transfer(&env.current_contract_address(), &member, &contribution_amount);
                env.storage().persistent().remove(&key);
            }
        }

        env.storage().instance().remove(&DataKey::Members);
        env.storage().instance().remove(&DataKey::ContributionAmount);
        env.storage().instance().remove(&DataKey::CycleLength);
        
        let next_id = Self::get_circle_id(&env) + 1;
        env.storage().instance().set(&DataKey::CircleId, &next_id);
    }

    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    pub fn get_registry(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Registry).unwrap()
    }

    pub fn get_members(env: Env) -> Vec<Address> {
        if env.storage().instance().has(&DataKey::Members) {
            env.storage().instance().get(&DataKey::Members).unwrap()
        } else {
            Vec::new(&env)
        }
    }

    pub fn get_contribution_amount(env: Env) -> i128 {
        if env.storage().instance().has(&DataKey::ContributionAmount) {
            env.storage().instance().get(&DataKey::ContributionAmount).unwrap()
        } else {
            0
        }
    }

    pub fn get_cycle_length(env: Env) -> u64 {
        if env.storage().instance().has(&DataKey::CycleLength) {
            env.storage().instance().get(&DataKey::CycleLength).unwrap()
        } else {
            0
        }
    }

    pub fn is_contributed(env: Env, cycle_id: u64, member: Address) -> bool {
        let circle_id = Self::get_circle_id(&env);
        let key = DataKey::Contributed(circle_id, cycle_id, member);
        env.storage().persistent().has(&key)
    }

    pub fn is_cycle_paid(env: Env, cycle_id: u64) -> bool {
        let circle_id = Self::get_circle_id(&env);
        let paid_key = DataKey::CyclePaid(circle_id, cycle_id);
        env.storage().persistent().has(&paid_key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{vec, Env, Address};
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::token::{Client as TokenClient, StellarAssetClient};

    // ----------------------------------------------------------------
    // Happy path: all members contribute, cycle 0 payout to member[0]
    // ----------------------------------------------------------------
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

    // ----------------------------------------------------------------
    // Edge-case 1: member tries to contribute a second time in same cycle
    // ----------------------------------------------------------------
    #[test]
    #[should_panic(expected = "member already contributed for this cycle")]
    fn test_double_contribution() {
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
        let members = vec![&env, member_a.clone(), member_b.clone()];

        registry_client.register_members(&members);
        client.create_circle(&members, &100, &10);

        // Fund for two contributions
        sac_client.mint(&member_a, &200);
        client.contribute(&member_a, &0);
        // Second call must panic
        client.contribute(&member_a, &0);
    }

    // ----------------------------------------------------------------
    // Edge-case 2: create_circle with empty members vec must panic
    // ----------------------------------------------------------------
    #[test]
    #[should_panic(expected = "must have members")]
    fn test_create_empty_circle() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let sac = env.register_stellar_asset_contract_v2(admin);
        let token_address = sac.address();

        let registry_id = env.register(member_registry::MemberRegistry, ());

        let contract_id = env.register(PoolContract, ());
        let client = PoolContractClient::new(&env, &contract_id);

        client.initialize(&token_address, &registry_id);

        // Empty vec — must reject
        client.create_circle(&vec![&env], &100, &10);
    }

    // ----------------------------------------------------------------
    // Edge-case 3: contributing to an already-closed cycle must panic
    // ----------------------------------------------------------------
    #[test]
    #[should_panic(expected = "cycle already paid out")]
    fn test_contribute_after_payout() {
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
        let members = vec![&env, member_a.clone(), member_b.clone()];

        registry_client.register_members(&members);
        client.create_circle(&members, &100, &10);

        // Complete cycle 0 legitimately
        sac_client.mint(&member_a, &100);
        sac_client.mint(&member_b, &100);
        client.contribute(&member_a, &0);
        client.contribute(&member_b, &0);
        client.payout(&0);

        // Late contribution to closed cycle — must panic
        sac_client.mint(&member_a, &100);
        client.contribute(&member_a, &0);
    }

    // ----------------------------------------------------------------
    // Edge-case 4: single-member circle pays itself back
    // ----------------------------------------------------------------
    #[test]
    fn test_single_member_cycle() {
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

        let sole_member = Address::generate(&env);
        let members = vec![&env, sole_member.clone()];

        registry_client.register_members(&members);
        client.create_circle(&members, &500, &5);

        sac_client.mint(&sole_member, &500);
        assert_eq!(token_client.balance(&sole_member), 500);

        client.contribute(&sole_member, &0);
        assert_eq!(token_client.balance(&sole_member), 0); // held in escrow

        client.payout(&0);
        assert_eq!(token_client.balance(&sole_member), 500); // returned in full
    }

    // ----------------------------------------------------------------
    // Edge-case 5: payout recipient rotates across three cycles
    // ----------------------------------------------------------------
    #[test]
    fn test_payout_recipient_rotates() {
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

        let m0 = Address::generate(&env);
        let m1 = Address::generate(&env);
        let m2 = Address::generate(&env);
        let members = vec![&env, m0.clone(), m1.clone(), m2.clone()];

        registry_client.register_members(&members);
        client.create_circle(&members, &100, &10);

        // Fund all for 3 cycles (300 each)
        for m in members.iter() {
            sac_client.mint(&m, &300);
        }

        // Cycle 0 – m0 receives 300
        for m in members.iter() { client.contribute(&m, &0); }
        client.payout(&0);
        let bal0_c0 = token_client.balance(&m0);
        let bal1_c0 = token_client.balance(&m1);
        let bal2_c0 = token_client.balance(&m2);
        // m0 paid 100 and received 300 → net +200 → 200 + 300 = 400? No:
        // started 300, paid 100 (now 200), received 300 (now 500... wait)
        // Actually: token_client tracks absolute balances after transfer.
        // m0: 300 - 100 + 300 = 500, m1: 300 - 100 = 200, m2: 300 - 100 = 200
        assert_eq!(bal0_c0, 500, "m0 should receive cycle 0 payout");
        assert_eq!(bal1_c0, 200);
        assert_eq!(bal2_c0, 200);

        // Cycle 1 – m1 receives 300
        for m in members.iter() { client.contribute(&m, &1); }
        client.payout(&1);
        // m0: 500 - 100 = 400, m1: 200 - 100 + 300 = 400, m2: 200 - 100 = 100
        assert_eq!(token_client.balance(&m0), 400);
        assert_eq!(token_client.balance(&m1), 400, "m1 should receive cycle 1 payout");
        assert_eq!(token_client.balance(&m2), 100);

        // Cycle 2 – m2 receives 300
        for m in members.iter() { client.contribute(&m, &2); }
        client.payout(&2);
        // m0: 400 - 100 = 300, m1: 400 - 100 = 300, m2: 100 - 100 + 300 = 300
        assert_eq!(token_client.balance(&m0), 300);
        assert_eq!(token_client.balance(&m1), 300);
        assert_eq!(token_client.balance(&m2), 300, "m2 should receive cycle 2 payout");
    }
}
