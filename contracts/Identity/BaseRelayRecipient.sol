// SPDX-License-Identifier:MIT
pragma solidity 0.8.18;

/**
 * A base contract to be inherited by any contract that want to receive relayed transactions
 * A subclass must use "_msgSender()" instead of "msg.sender"
 */
abstract contract BaseRelayRecipient {
    /*
     * Forwarder singleton we accept calls from
     */
    address internal trustedForwarder =
        0xa4B5eE2906090ce2cDbf5dfff944db26f397037D;

    /**
     * return the sender of this call.
     * if the call came through our Relay Hub, return the original sender.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _msgSender() internal virtual returns (address sender) {
        bytes memory bytesSender;
        (, bytesSender) = trustedForwarder.call(
            abi.encodeWithSignature("getMsgSender()")
        );

        return abi.decode(bytesSender, (address));
    }
}
