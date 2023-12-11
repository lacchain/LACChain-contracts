// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../generic/PublicDirectory.sol";
import "../../../utils/Ownable.sol";
import "../../../common/BaseRelayRecipient.sol";

contract PublicDirectoryGM is PublicDirectory, BaseRelayRecipient {
    constructor(
        address trustedForwarderAddress
    ) BaseRelayRecipient(trustedForwarderAddress) {}

    /**
     * return the sender of this call.
     * if the call came through our Relay Hub, return the original sender.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _msgSender()
        internal
        view
        override(BaseRelayRecipient, Context)
        returns (address sender)
    {
        return BaseRelayRecipient._msgSender();
    }
}
