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

    constructor(
        address trustedForwarderAddress,
        uint8 rootDepth,
        string memory did,
        address rootEntityManager
    ) BaseRelayRecipient(trustedForwarderAddress) {
        depth = rootDepth;
        tlCounter++;
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
        tlCounter++;
        uint256 memberGId = tlCounter;

        uint256 parentGId = group[parentEntity].gId;
        require(parentGId > 0, "NA");
        _verifyIfChildCanBeAdded(parentGId, depth);

        _configTl(memberGId, memberDid, memberEntity);

        uint256 iat = _getTimestamp();

        TlDetail storage t = trustedList[parentGId][memberGId];
        require(t.iat == uint256(0), "TLAA");
        trustedBy[memberGId] = parentGId;
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
            addr := h
        }
    }

    function _verifyIfChildCanBeAdded(uint256 parentGId, uint8 d) public view {
        require(d > 0, "DOOT");
        if (parentGId == 1) {
            return;
        }
        parentGId = trustedBy[parentGId];
        return _verifyIfChildCanBeAdded(parentGId, d - 1);
    }
}
