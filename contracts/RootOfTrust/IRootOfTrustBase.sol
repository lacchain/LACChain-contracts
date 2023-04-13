//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

interface IRootOfTrustBase {
    struct groupDetail {
        uint256 gId;
        address didAddress;
    }

    struct MemberDetail {
        uint256 iat;
        uint256 exp;
    }
    event DidChanged(address entity, string did, uint256 prevBlock);
    event DepthChanged(uint8 prevDepth, uint8 depth, uint256 prevBlock);
    event RevokeModeChanged(
        uint8 prevRevokeMode,
        uint8 revokeMode,
        uint256 prevBlock
    );
    event MaintainerModeChanged(bool isRootMaintainer, uint256 prevBlock);
    event MemberConfigChanged(
        address indexed entityAddress,
        string did,
        uint256 prevBlock
    );
    event GroupMemberChanged(
        address indexed parentEntity,
        address indexed memberEntity,
        string did,
        uint256 iat,
        uint256 exp,
        uint256 prevBlock
    );

    event GroupMemberRevoked(
        address indexed revokerEntity,
        address indexed parentEntity,
        address indexed memberEntity,
        string did,
        uint256 exp,
        uint256 prevBlock
    );

    function updateMaintainerMode(bool rootMaintainer) external;

    function updateDepth(uint8 rootDepth) external;

    function updateRevokeMode(uint8 revokeMode) external;

    function updateDid(string memory did) external;

    function addOrUpdateGroupMember(
        address memberEntity,
        string memory did,
        uint256 period
    ) external;

    function revokeMember(address memberEntity, string memory did) external;

    function revokeMemberByRoot(
        address memberEntity,
        string memory did
    ) external;

    function revokeMemberByAnyAncestor(
        address memberEntity,
        string memory did
    ) external;
}
