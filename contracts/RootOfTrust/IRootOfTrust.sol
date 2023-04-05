//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.18;

interface IRootOfTrust {
    struct groupDetail {
        uint256 gId;
        address didAddress;
    }

    struct TlDetail {
        uint256 iat;
        uint256 exp;
    }
    event DepthChange(uint8 depth, uint256 prevBlock);
    event TlConfigChange(address indexed tl, string did, uint256 prevBlock);
    event MemberOnboarded(address indexed tl, uint256 prevBlock);
    event PkAdded(
        address indexed parentEntity,
        address indexed memberEntity,
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
}
