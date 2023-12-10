// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../../../../common/upgradeable/BaseRelayRecipientUpgradeable.sol";

import "../../generic/upgradeable/CorePublicDirectoryUpgradeable.sol";

contract PublicDirectoryGMUpgradeable is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    BaseRelayRecipientUpgradeable,
    CorePublicDirectoryUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address trustedForwarderAddress) public initializer {
        __BaseRelayRecipient_init(trustedForwarderAddress);
        __Ownable_init();
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
        bytes memory bytesSender;
        bool success;
        (success, bytesSender) = trustedForwarder.staticcall(
            abi.encodeWithSignature("getMsgSender()")
        );

        require(success, "SCF");

        return abi.decode(bytesSender, (address));
    }
}
