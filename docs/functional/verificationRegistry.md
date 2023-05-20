# Verification Registry

Verification Registry Smart contract is an optimized implentation focused on concurent revocation of any kind of data expresed as a simple unique identifier (e.g. cryptographic digest).

## Terminology

- digest: The output of applying a hash function to any kind of data data.
- issue: In this context, the process of registering a digest cryptographically endorsed by an entity interacting with this contract.
- entity: The one interacting with this contract to perform some action.

## Base Considerations

- Permissionless: This contracts is open to anyone.
- There are four basic features in this implementation:

  - Issuance: The process by which an entity endoreses a digest.
  - Revocation: By revoking a digest it must be considered not valid anymore by the entity revoking that fact. A digest can be revoked directly without previously having been issued.
  - update: A digest can only be updated if it was previously issued. The update can only be applied in regards to the expiration date.
  - On Hold: Under some circumstances, the entity may want to put "on hold" a digest for some time. It may be useful for cases where the underlying data digest is being analyzed or while some issue being resolved. Either way, when a digest is "on hold" it should not be considered valid. The resolution of "on hold" state, in the context of an issuer, could lead to move that digest to the "issued" or "revoked" state (revoked is an irreversible permanent state).

- Inside organizations there may be the case where diferent dependencies may need to endorse a digest on behalf of the organization. Taking this into account, this contract integrates with an ERC-1056 derived implementation which allows these departments to execute actions which are finally made as if those actions were made by the organization.

## Smart Contract Considerations

- Even when in this documentation it is mentioned the term "digest" to express a unique identifier for some data; in reality the unique identifier may be any kind of identifier that can be expressed as a bytes32 representation.
- Any digest will use keccak256 hashing algorithm since this is the default algorithm used for hashing in Ethereum.
- When issuing a digest it is also important to consider the need of sending many operations at the same time. This contract implements uses EIP712 to encapsulate the sender in such a way that the concept of "msg.sender" is decoupled from the "entity" performing an operation in this contract. The benefit of doing this is that an entity can kind of "send" many transactions in the same block.
  - This feature was implemented for the most demanding methods which are "issue" and "delegate".
- On contract deplyment it is required to pass the defaultDelegateType; this variable represents a bytes32 representation of a delegate type according to ERC1056. Additionally, any entity desiring to use a custom delegate type other than defaultDelegateType can do it by setting that custom delegate type which will be valid only for that entity but not valid for any other member.
- At any time, an entity is able to point to a different didRegistry instance. This gives the flexibility to:
  - Point to a modified implementation of the didRegistry which still follows the same [didRegistry interface](../../contracts/identity/IDIDRegistry.sol). Consider this option carefully, since your delegates must be set at that contract instance, otherwise didRegistry validations would fail.

## Smart contracts

- [Verification Registry](../../contracts/credentials/VerificationRegistry.sol)

## Smart contracts Methods and Emmitted events

- [Verification Registry Interface](../../contracts/credentials/IVerificationRegistry.sol)
