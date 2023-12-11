// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./ChainOfTrustBase.sol";
import "../../../common/AbstractIdentityHandler.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "../IChainOfTrust.sol";
import "../generic/AbstractCoreChainOfTrust.sol";

abstract contract AbstractDelegatedChainOfTrust is
    AbstractCoreChainOfTrust,
    AbstractIdentityHandler
{
    // ########################################################################################## //
    function __AbstractDelegatedChainOfTrust_init(
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer,
        address didRegistry,
        bytes32 delegateType
    ) internal {
        __AbstractCoreChainOfTrust_init(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer
        );
        __AbstractIdentityHandler_init(didRegistry, delegateType);
    }

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

    // ########################################################################################## //
    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     * Since this class is the base one used for upgradeable and non-upgradeable versions a gap is used to allow contract extension.
     */
    uint256[45] private __gap;
}
