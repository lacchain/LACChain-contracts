// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../../../../common/upgradeable/BaseRelayRecipientUpgradeable.sol";

import "../../generic/upgradeable/CorePublicDirectoryUpgradeable.sol";

contract PublicDirectoryGMUpgradeable is
    Initializable,
    UUPSUpgradeable,
    BaseRelayRecipientUpgradeable,
    CorePublicDirectoryUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * BaseRelayRecipeint MUST be called before CorePublicDirectory_init since the last one initialized OwnableUpgradeable.
     */
    function initialize(address trustedForwarderAddress) public initializer {
        __BaseRelayRecipient_init(trustedForwarderAddress);
        __CorePublicDirectoryUpgradeable_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    /**
     * return the sender of this call.
     * if the call came through our Relay Hub, return the original sender.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _msgSender()
        internal
        view
        override(BaseRelayRecipientUpgradeable, ContextUpgradeable)
        returns (address sender)
    {
        return BaseRelayRecipientUpgradeable._msgSender();
    }
}
