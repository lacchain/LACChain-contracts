//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.18;

interface IRootOfTrust {
    event DepthChange(address indexed tl, uint8 depth, uint256 prevBlock);
    event TlConfigChange(
        address indexed tl,
        string did,
        uint8 depth,
        uint256 prevBlock
    );
    event MemberOnboarded(address indexed tl, uint256 prevBlock);
    event PkAdded(
        address indexed parentTl,
        address indexed tl,
        string did,
        uint256 iat,
        uint256 exp,
        uint256 prevBlock
    );

    event PkUpdated(
        address indexed parentTl,
        address indexed tl,
        string did,
        uint256 iat,
        uint256 exp,
        uint256 prevBlock
    );

    event PkRevoked(
        address indexed parentTl,
        address indexed tl,
        string did,
        uint256 exp,
        uint256 prevBlock
    );

    function configRootTl(string memory did, uint8 depth) external;

    function configTl(uint8 depth, string memory didStr) external;

    function approveTlCandidate(address tl) external;

    /**
     * @param period: given in seconds
     */
    function addRootTl(address tl, string memory did, uint256 period) external;

    function updateRootTl(
        address tl,
        string memory did,
        uint256 period
    ) external;

    /**
     * @param period: given in seconds
     */
    function addTl(address tl, string memory did, uint256 period) external;

    /**
     * @param period: given in seconds
     */
    function updateTl(address tl, string memory did, uint256 period) external;

    /**
     * The removed tl must be in onboarded in this contract.
     * It is not necessary to add a tl as a prior step before revoking it.
     */
    function revokeTl(address tl, string memory did) external;

    function revokeRootTl(address tl, string memory did) external;
}
