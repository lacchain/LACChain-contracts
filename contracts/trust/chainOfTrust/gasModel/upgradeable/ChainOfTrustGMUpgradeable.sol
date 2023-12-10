//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./AbstractChainOfTrustGMUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../../../../common/upgradeable/IdentityHandlerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ChainOfTrustGMUpgradeable is
    Initializable,
    AbstractChainOfTrustGMUpgradeable,
    IdentityHandlerUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address trustedForwarderAddress,
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer,
        address didRegistry,
        bytes32 delegateType
    ) public initializer {
        __AbstractChainOfTrustGMUpgradeable_init(
            trustedForwarderAddress,
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

    /**
     * return the sender of this call.
     * if the call came through our Relay Hub, return the original sender.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _msgSender()
        internal
        view
        override(AbstractChainOfTrustGMUpgradeable, ContextUpgradeable)
        returns (address sender)
    {
        bytes memory bytesSender;
        bool success;
        (success, bytesSender) = trustedForwarder.staticcall(
            abi.encodeWithSignature("getMsgSender()")
        );

        require(success, "SCF");

        return abi.decode(bytesSender, (address));
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
