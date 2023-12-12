//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../../generic/AbstractDelegatedChainOfTrust.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../../../../common/upgradeable/BaseRelayRecipientUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

contract ChainOfTrustGMUpgradeable is
    Initializable,
    AbstractDelegatedChainOfTrust,
    UUPSUpgradeable,
    OwnableUpgradeable,
    BaseRelayRecipientUpgradeable
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
        __AbstractDelegatedChainOfTrust_init(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer,
            didRegistry,
            delegateType
        );
        __BaseRelayRecipient_init(trustedForwarderAddress);
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner()
        public
        view
        virtual
        override(OwnableUpgradeable, Owner)
        returns (address)
    {
        return OwnableUpgradeable.owner();
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner()
        internal
        view
        virtual
        override(OwnableUpgradeable, Owner)
    {
        OwnableUpgradeable._checkOwner();
    }

    function _msgSender()
        internal
        view
        virtual
        override(Ctx, ContextUpgradeable, BaseRelayRecipientUpgradeable)
        returns (address)
    {
        return BaseRelayRecipientUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(Ctx, ContextUpgradeable)
        returns (bytes calldata)
    {
        return ContextUpgradeable._msgData();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
