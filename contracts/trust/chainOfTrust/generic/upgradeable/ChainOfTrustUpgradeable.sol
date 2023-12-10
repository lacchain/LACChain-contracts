//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./AbstractChainOfTrustUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../../../common/upgradeable/IdentityHandlerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ChainOfTrustUpgradeable is
    Initializable,
    AbstractChainOfTrustUpgradeable,
    IdentityHandlerUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer,
        address didRegistry,
        bytes32 delegateType
    ) public initializer {
        __AbstractChainOfTrustUpgradeable_init(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer
        );
        __IdentityHandler_init(didRegistry, delegateType, "ChainOfTrust");
        __UUPSUpgradeable_init();
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

    function _msgSender()
        internal
        view
        virtual
        override(ContextUpgradeable, AbstractChainOfTrustUpgradeable)
        returns (address)
    {
        return ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(ContextUpgradeable, AbstractChainOfTrustUpgradeable)
        returns (bytes calldata)
    {
        return ContextUpgradeable._msgData();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
