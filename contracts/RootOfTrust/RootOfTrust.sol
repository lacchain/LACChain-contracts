// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../Common/BaseRelayRecipient.sol";
import "./IRootOfTrust.sol";

import "../utils/Ownable.sol";

contract RootOfTrust is Ownable, IRootOfTrust {
    uint256 tlCounter;
    // entityManager => gId
    mapping(address => groupDetail) group;
    // gId => entityManager
    mapping(uint256 => address) manager;

    // gIdParent => gIdMember  => groupMemberDetail
    mapping(uint256 => mapping(uint256 => TlDetail)) trustedList;

    mapping(uint256 => uint256) trustedBy;

    uint8 depth;

    constructor(
        address trustedForwarderAddress,
        uint8 rootDepth,
        string memory did,
        address rootEntityManager
    ) BaseRelayRecipient(trustedForwarderAddress) {
        depth = rootDepth;
        _configTl(tlCounter++, did, rootEntityManager);
    }

    uint256 prevBlock;

    function updateDepth(uint8 rootDepth) external onlyOwner {
        // todo validate whether only owner
        depth = rootDepth;
        emit DepthChange(depth, prevBlock);
        prevBlock = block.number;
    }

    function _configTl(
        uint256 gId,
        string memory did,
        address entityManager
    ) private {
        groupDetail storage gd = group[entityManager];
        gd.gId = gId;
        manager[gId] = entityManager;
        address didAddr = _computeAddress(did);
        gd.didAddress = didAddr;
        emit TlConfigChange(entityManager, did, prevBlock);
        prevBlock = block.number;
    }

    function addMemberTl(
        address memberEntity,
        string memory did,
        uint256 period
    ) external {
        address parentEntity = _msgSender();
        uint256 exp = _getExp(period);
        _addMemberTl(parentEntity, memberEntity, did, exp);
    }

    function _getTimestamp() private view returns (uint256 timestamp) {
        timestamp = block.timestamp;
    }

    function _getExp(uint256 period) private view returns (uint256 exp) {
        uint256 currentTime = _getTimestamp();
        require(type(uint256).max - currentTime >= period, "IP");
        exp = currentTime + period;
    }

    function _addMemberTl(
        address parentEntity,
        address memberEntity, //tl
        string memory memberDid,
        uint256 exp
    ) private {
        require(group[memberEntity].gId == 0, "MAA");
        uint256 memberGId = tlCounter++;

        uint256 parentGId = group[parentEntity].gId;
        require(parentGId > 0, "NA");
        _verifyDepth(parentGId, 0, depth);

        _configTl(memberGId, memberDid, memberEntity);

        uint256 iat = _getTimestamp();

        TlDetail storage t = trustedList[parentGId][memberGId];
        require(t.iat == uint256(0), "TLAA");
        t.iat = iat;
        t.exp = exp;
        emit PkAdded(
            parentEntity,
            memberEntity,
            memberDid,
            iat,
            exp,
            prevBlock
        );
        prevBlock = block.number;
    }

    function _computeAddress(
        string memory txt
    ) private pure returns (address addr) {
        bytes32 h = keccak256(abi.encode((txt)));
        assembly {
            addr := mload(0) // @todo
        }
    }

    function _verifyDepth(uint256 gId, uint8 d, uint8 maxDepth) private view {
        require(d <= maxDepth, "DOOT");
        if (gId == 1) {
            return;
        }
        gId = trustedBy[gId];
        return _verifyDepth(gId, d++, maxDepth);
    }
}
