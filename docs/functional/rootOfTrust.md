# Root Of Trust

Root of Trust smart contract is part of a stack of contracts that comprise Chain of Trust, a term coined with the concept of trust that provides entities the ability to verify whether another entity is trusted.

## Terminology

- depth: Maximum number of steps to go from any entity to the root entity.
- entity: any participant in the root of trust contract.

## Base Considerations

- Root of Trust can be used as a reference which means applications using this component can use additional custom lists to make further filtering over a particular entity.
- The root of trust concept starts with an entity that is set as the root entity.
- The root entity can add more members in a sort of trusted relationship by which the first one (parent entity) acknowledges the added entity (child entity) as a trusted member.
- Resolving whether a child entity is trusted depends on the number of steps ("levels") taken to reach the root of trust.
- A child entity is trusted if "levels" is less or equal than the maximum depth" (an integer positive number defined on contract creation).
- When a child entity is added, the parent must specify the expiration time for the added child entity.
- A child entity is added just once.
- If the expiration time for an added child entity is reached then it is considered not trusted unless some other entity adds it again (it is possible to add the entity again only in the case of expiration time reached)
- An entity can claim to be associated with a decentralized identifier (did). Validating that claim is accomplished by retrieving the did document according to the did method used in that specific did and verifying whether the entity address appears in that document, the used relationship in the verification method is specified in the PKD Smart Contract. The verification of that claim is outside of the scope of this contract.
- Any entity can update the decentralized identifier it claims to be is associated with.
- Revocation Mode refers to the capability to revoke an entity. There are three options:
  - A parent entity can revoke a child entity it added (always)
  - Optionally a Root Entity can also revoke any child entity (Only if configured this way) OR
  - Any parent (including the root entity) can revoke any child entity, only if the parent entity is an ancestor of the child entity (Only if configured this way)

## Smart Contract Considerations

- Since the concept of Root of Trust involves many entities, on deployment this contract sets a committee that acts as an owner in regards to the decisions taken for the deployed contract. The owner has two group of responsibilities (Business and Owner)
  - Business Resposibilities are:
    - update the "depth" parameter.
    - update the "revocation mode" parameter
  - Maintainer Resposibilities are:
    - Handle Upgrades.
    - Handle the ownership of the contract
- On contract deployment it is possible to decouple the Business and Maintainer responsibilities in such a way that Business responsibilities are assigned to
  the root entity. Otherwise it is assigned to the owner of the contract during the contract deployment.
- The owner can assign, at any time, Business responsibilities to themselves or to the root entity.

## Smart contracts

Root of Trust smart contract is architecturally composed by the follings:

- **Root of Trust Base contract**: The Smart contract that exposes the core functionalities.
- **Root of Trust**: The Smart contract that extends Root of Trust Base contract and allows integration with a Did Registry Based on ERC-1056, this integration allows to treat each entity address in the root of trust as the base address on top of which an ERC-1056 compliant DID is created. Thus on adding a new entity it can be verified that the message sender is the controller of the did parent that attempts to add the new entity to the chain of trust. Furthermore delegates can send the transaction on behalf of the parent entity.

## Smart contracts Methods and Emmitted events

- [Root of Trust Base contract](../../contracts/RootOfTrust/IRootOfTrustBase.sol)
- [Root of Trust](../../contracts/RootOfTrust/IRootOfTrust.sol)
