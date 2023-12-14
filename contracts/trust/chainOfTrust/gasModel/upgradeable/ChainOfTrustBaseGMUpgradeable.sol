// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../../../../common/upgradeable/BaseRelayRecipientUpgradeable.sol";
import "../../generic/upgradeable/AbstractChainOfTrustUpgradeable.sol";

contract ChainOfTrustBaseGMUpgradeable is
    Initializable,
    BaseRelayRecipientUpgradeable,
    AbstractChainOfTrustUpgradeable,
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
        bool rootMaintainer
    ) public initializer {
        __BaseRelayRecipient_init(trustedForwarderAddress);
        __AbstractChainOfTrustUpgradeable_init(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer
        );
        __UUPSUpgradeable_init();
    }

    /**
     * return the sender of this call.
     * if the call came through our Relay Hub, return the original sender.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _msgSender()
        internal
        view
        virtual
        override(BaseRelayRecipientUpgradeable, AbstractChainOfTrustUpgradeable)
        returns (address sender)
    {
        return BaseRelayRecipientUpgradeable._msgSender();
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
