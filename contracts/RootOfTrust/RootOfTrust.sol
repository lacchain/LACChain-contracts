//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../utils/IdentityHandler.sol";
import "./RootOfTrustBase.sol";
import "./IRootOfTrust.sol";

contract RootOfTrust is RootOfTrustBase, IdentityHandler, IRootOfTrust {
    constructor(
        address trustedForwarderAddress,
        uint8 rootDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer,
        address didRegistry,
        bytes32 delegateType
    )
        RootOfTrustBase(
            trustedForwarderAddress,
            rootDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer
        )
        IdentityHandler(didRegistry, delegateType, "ChainOfTrust")
    {}

    function addOrUpdateGroupMemberByDelegate(
        address parentEntity,
        address memberEntity,
        string memory did,
        uint256 period
    ) external {
        _validateDelegate(
            _getDefaultDidRegistry(),
            parentEntity,
            _getDefaultDelegateType(),
            _msgSender()
        );
        _addOrUpdateGroupMember(
            parentEntity,
            memberEntity,
            did,
            _getExp(period)
        );
    }

    function revokeMemberByDelegate(
        address parentEntity,
        address memberEntity,
        string memory did
    ) external {
        _validateDelegate(
            _getDefaultDidRegistry(),
            parentEntity,
            _getDefaultDelegateType(),
            _msgSender()
        );
        _revokeMember(parentEntity, parentEntity, memberEntity, did);
    }

    function revokeMemberByRootByTheirDelegate(
        address memberEntity,
        string memory did
    ) external {
        address actor = manager[1];
        _validateDelegate(
            _getDefaultDidRegistry(),
            actor,
            _getDefaultDelegateType(),
            _msgSender()
        );
        _revokeMemberByRoot(memberEntity, did, actor);
    }

    function revokeMemberByAnyAncestorByTheirDelegate(
        address ancestor,
        address memberEntity,
        string memory did
    ) external {
        _validateDelegate(
            _getDefaultDidRegistry(),
            ancestor,
            _getDefaultDelegateType(),
            _msgSender()
        );
        _revokeMemberByAnyAncestor(ancestor, memberEntity, did);
    }
}
