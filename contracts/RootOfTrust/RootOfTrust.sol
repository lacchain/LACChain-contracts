// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../Common/BaseRelayRecipient.sol";
import "./IRootOfTrust.sol";

import "../utils/Ownable.sol";

contract RootOfTrust is Ownable, IRootOfTrust {
    uint256 public tlCounter;
    // entityManager => (gId, didAddress)
    mapping(address => groupDetail) public group;
    // gId => entityManager
    mapping(uint256 => address) manager;

    // gIdParent => gIdMember  => groupMemberDetail
    mapping(uint256 => mapping(uint256 => TlDetail)) public trustedList;

    mapping(uint256 => uint256) public trustedBy;

    uint8 public depth;
    uint8 revokeConfigMode;

    constructor(
        address trustedForwarderAddress,
        uint8 rootDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode
    ) BaseRelayRecipient(trustedForwarderAddress) {
        depth = rootDepth;
        tlCounter++;
        revokeConfigMode = revokeMode;
        _configTl(tlCounter, did, rootEntityManager);
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

    function addOrUpdateMemberTl(
        address memberEntity,
        string memory did,
        uint256 period
    ) external {
        address parentEntity = _msgSender();
        uint256 exp = _getExp(period);
        _addOrUpdateMemberTl(parentEntity, memberEntity, did, exp);
    }

    function revokeMember(address memberEntity, string memory did) external {
        address parentEntity = _msgSender();
        _revokeMember(parentEntity, parentEntity, memberEntity, did);
    }

    function revokeMemberByRoot(
        address memberEntity,
        string memory did
    ) external {
        require(revokeConfigMode == 1, "RBYRNE");
        uint256 memberEntityGId = group[memberEntity].gId;
        uint256 parentEntityGId = trustedBy[memberEntityGId];
        require(parentEntityGId > 0, "MNA"); // means "memberEntity" was not added to any group
        address parentEntity = manager[parentEntityGId];
        address rootEntity = _msgSender();
        require(group[rootEntity].gId == 1, "OR");
        _revokeMember(rootEntity, parentEntity, memberEntity, did);
    }

    function _revokeMember(
        address revokerEntity,
        address parentEntity,
        address memberEntity,
        string memory did
    ) private {
        uint256 parentGId = group[parentEntity].gId;
        uint256 memberGId = group[memberEntity].gId;
        TlDetail storage d = trustedList[parentGId][memberGId];
        uint256 currentTime = block.timestamp;
        require(d.exp > currentTime, "MAE");
        _validateDidMatch(did, memberEntity);
        d.exp = currentTime;
        emit PkRevoked(
            revokerEntity,
            parentEntity,
            memberEntity,
            did,
            currentTime,
            prevBlock
        );
        prevBlock = block.number;
    }

    function _getTimestamp() private view returns (uint256 timestamp) {
        timestamp = block.timestamp;
    }

    function _getExp(uint256 period) private view returns (uint256 exp) {
        uint256 currentTime = _getTimestamp();
        require(type(uint256).max - currentTime >= period, "IP");
        exp = currentTime + period;
    }

    function _addOrUpdateMemberTl(
        address parentEntity,
        address memberEntity,
        string memory memberDid,
        uint256 exp
    ) private {
        groupDetail memory g = group[memberEntity];
        // require(g.gId == 0, "MAA"); // todo
        uint256 memberGId;
        uint256 parentGId = group[parentEntity].gId;
        if (g.gId > 0) {
            _checkParentOrThrow(g.gId, parentGId);
            memberGId = g.gId;
            _validateDidMatch(memberDid, memberEntity);
        } else {
            tlCounter++;
            memberGId = tlCounter;
            _configTl(memberGId, memberDid, memberEntity);
        }
        require(parentGId > 0, "NA");
        _verifyWhetherAChildCanBeAdded(parentGId, depth);

        uint256 iat = _getTimestamp();

        TlDetail storage t = trustedList[parentGId][memberGId];
        // require(t.iat == uint256(0), "TLAA"); // todo: check
        trustedBy[memberGId] = parentGId;
        t.iat = iat;
        t.exp = exp;
        emit PkChanged(
            parentEntity,
            memberEntity,
            memberDid,
            iat,
            exp,
            prevBlock
        );
        prevBlock = block.number;
    }

    function _validateDidMatch(
        string memory memberDid,
        address memberEntity
    ) private view {
        require(
            _computeAddress(memberDid) == group[memberEntity].didAddress,
            "DDM"
        );
    }

    function _checkParentOrThrow(
        uint256 memberGId,
        uint256 parentCandidate
    ) private view {
        uint256 parentGId = trustedBy[memberGId];
        if (!_checkChainOfTrustByExpiration(parentGId)) return; // if chain is broken by expiration then allow adding some child of that chain
        if (parentGId == parentCandidate) return;
        _checkParentIsExpired(parentGId, memberGId);
    }

    function _checkParentIsExpired(
        uint256 parentGId,
        uint256 memberGId
    ) private view {
        require(trustedList[parentGId][memberGId].exp < block.timestamp, "MAA");
    }

    function _computeAddress(
        string memory txt
    ) private pure returns (address addr) {
        bytes32 h = keccak256(abi.encode((txt)));
        assembly {
            addr := h
        }
    }

    function _verifyWhetherAChildCanBeAdded(
        uint256 parentGId,
        uint8 d
    ) private view {
        require(d > 0, "DOOT");
        if (parentGId == 1) {
            return;
        }
        uint256 grandParentGId = trustedBy[parentGId];
        require(
            trustedList[grandParentGId][parentGId].exp > block.timestamp,
            "NA"
        );
        return _verifyWhetherAChildCanBeAdded(grandParentGId, d - 1);
    }

    function _checkChainOfTrustByExpiration(
        uint256 memberGId
    ) private view returns (bool isValid) {
        if (memberGId == 1) {
            // because of the hierarchy of chain of trust, code will eventually reach here
            return true;
        }
        uint256 parentGId = trustedBy[memberGId];
        if (trustedList[parentGId][memberGId].exp < block.timestamp)
            return false;
        return _checkChainOfTrustByExpiration(parentGId); // (grandParentGId, d - 1);
    }
}
