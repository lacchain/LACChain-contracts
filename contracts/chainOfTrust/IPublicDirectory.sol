// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IPublicDirectory {
    struct member {
        string name;
        address chainOfTrustManager;
        uint256 exp;
        uint256 iat;
        uint256 uat;
        bool expires;
    }

    struct setMember {
        string did;
        string name;
        address chainOfTrustManager;
        uint256 exp;
        bool expires; // if true, then exp must be greater than current timestamp
        address chainOfTrustAddress;
    }

    /**
     * Document prevBlock
     */
    event MemberChanged(
        string did,
        uint256 iat,
        uint256 exp,
        bool expires,
        uint256 currentTimestap,
        uint256 prevBlock
    );

    event DidDisassociated(string did, uint256 memberId, uint256 prevBlock);

    /**
     * @dev Triggered when a new did is associated to an existing member data
     */
    event DidAssociated(string did, uint256 memberId, uint256 prevBlock);

    /**
     * @dev Triggered when a new Chain of Trust Smart Contract address is associated to an existing member
     * @param status If true, means the Chain of Trust Smart Contract address is being associated with the memberId; otherwise, means it is being disassociated.
     */
    event CoTChange(
        address cotAddress,
        uint256 memberId,
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

    function updateMemberDetails(setMember memory _member) external;

    function getMemberDetails(
        string memory did
    ) external view returns (member memory foundMember);

    /**
     * @dev Associates a did to an existing member data
     */
    function associateDid(string memory did, uint256 memberId) external;

    function disassociateDid(string memory did) external;

    function addCoTAddress(address cotAddress, uint256 memberId) external;

    function disassociateCoTAddress(
        address cotAddress,
        uint256 memberId
    ) external;

    function addCoTAddressByDid(address cotAddress, string memory did) external;

    function disassociateCoTAddressByDid(
        address cotAddress,
        string memory did
    ) external;
}
