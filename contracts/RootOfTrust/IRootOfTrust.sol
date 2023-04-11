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
    event DepthChange(uint8 prevDepth, uint8 depth, uint256 prevBlock);
    event RevokeModeChange(
        uint8 prevRevokeMode,
        uint8 revokeMode,
        uint256 prevBlock
    );
    event MaintainerModeChange(bool isRootMaintainer, uint256 prevBlock);
    event TlConfigChange(address indexed tl, string did, uint256 prevBlock);
    event MemberOnboarded(address indexed tl, uint256 prevBlock);
    event PkChanged(
        address indexed parentEntity,
        address indexed memberEntity,
        string did,
        uint256 iat,
        uint256 exp,
        uint256 prevBlock
    );

    event PkRevoked(
        address indexed revokerEntity,
        address indexed parentEntity,
        address indexed memberEntity,
        string did,
        uint256 exp,
        uint256 prevBlock
    );

    function addOrUpdateMemberTl(
        address memberEntity,
        string memory did,
        uint256 period
    ) external;
}
