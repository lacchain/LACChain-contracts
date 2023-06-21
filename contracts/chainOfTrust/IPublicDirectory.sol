// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IPublicDirectory {
    /**
     * @param exp Expiration data after which the registry is considered invalid
     * @param iat Registration date
     * @param expires If false, the registry never expires so `exp` is not required on registering the member as well as on verifying the registration
     * @param rawData Generic bytes of information regarding the member. Leaving just as bytes leves up to the application layer to handle different types of additional data
     * associated to the member as well as different versions.
     */
    struct member {
        uint256 exp;
        uint256 iat;
        uint256 uat;
        bool expires;
    }

    struct fullDetails {
        member memberData;
        uint256 memberId;
    }

    struct setMember {
        string did;
        uint256 exp;
        bool expires; // if true, then exp must be greater than current timestamp
        address chainOfTrustAddress;
        bytes rawData;
    }

    /**
     * Document prevBlock
     */
    event MemberChanged(
        uint256 indexed memberId,
        string did,
        uint256 iat,
        uint256 exp,
        bool expires,
        bytes rawData,
        uint256 currentTimestap,
        uint256 prevBlock
    );

    event DidDisassociated(
        string did,
        uint256 indexed memberId,
        uint256 prevBlock
    );

    /**
     * @dev Triggered when a new did is associated to an existing member data
     */
    event DidAssociated(
        string did,
        uint256 indexed memberId,
        uint256 prevBlock
    );

    /**
     * @dev Triggered when a new Chain of Trust Smart Contract address is associated to an existing member
     * @param status If true, means the Chain of Trust Smart Contract address is being associated with the memberId; otherwise, means it is being disassociated.
     */
    event CoTChange(
        address indexed cotAddress,
        uint256 indexed memberId,
        bool status,
        uint256 prevBlock
    );

    /**
     * @dev adds information data about an entity. Optionally associates a new chain of trust smart contract address with the referred entity.
     */
    function addMember(setMember memory _member) external;

    /**
     * @dev Deactivates the member.
     * @param did: one of the registered dids "decentralized identifier" associated to the member being deactivated
     */
    function removeMemberByDid(string memory did) external;

    function updateMemberDetailsByDid(setMember memory _member) external;

    function getMemberDetails(
        string memory did
    ) external view returns (fullDetails memory foundMember);

    /**
     * @dev Associates a did to an existing member data
     */
    function associateDid(
        string memory did,
        string memory didToAssociate
    ) external;

    function disassociateDid(
        string memory did,
        string memory didToDisassociate
    ) external;

    function associateCoTAddressByDid(
        address cotAddress,
        string memory did
    ) external;

    function disassociateCoTAddressByDid(
        address cotAddress,
        string memory did
    ) external;
}
