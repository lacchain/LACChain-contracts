//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.18;

interface IPKD {
    event PkAdded(
        address indexed parentTl,
        address indexed tl,
        string did,
        uint32 iat,
        uint32 exp,
        uint256 prevBlock
    );

    event PkUpdated(
        address indexed parentTl,
        address indexed tl,
        string did,
        uint32 iat,
        uint32 exp,
        uint256 prevBlock
    );

    event PkRevoked(
        address indexed parentTl,
        address indexed tl,
        string did,
        uint32 exp,
        uint256 prevBlock
    );

    function addRootLevelsOfTrust(uint8 depth) external;

    function associateDidWithTl(uint8 depth, string memory didStr) external;

    function approveTlCandidate(address tl) external;

    function addRootTl(address tl, string memory did, uint32 exp) external;

    function addTl(address tl, string memory did, uint32 exp) external;

    function updateTl(address tl, string memory did, uint32 exp) external;

    function revokeTl(address tl, string memory did) external;
}
