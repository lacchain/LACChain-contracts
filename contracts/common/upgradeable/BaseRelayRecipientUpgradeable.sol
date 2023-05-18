// SPDX-License-Identifier:MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * A base contract to be inherited by any contract that want to receive relayed transactions
 * A subclass must use "_msgSender()" instead of "msg.sender"
 */
abstract contract BaseRelayRecipientUpgradeable is
    Initializable,
    ContextUpgradeable
{
    /*
     * Forwarder singleton we accept calls from
     */
    address internal trustedForwarder;

    function __BaseRelayRecipient_init(
        address trustedForwarderAddr
    ) internal onlyInitializing {
        trustedForwarder = trustedForwarderAddr;
        __BaseRelayRecipient_init_unchained();
    }

    function __BaseRelayRecipient_init_unchained() internal onlyInitializing {}

    /**
     * return the sender of this call.
     * if the call came through our Relay Hub, return the original sender.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _msgSender()
        internal
        view
        virtual
        override
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
