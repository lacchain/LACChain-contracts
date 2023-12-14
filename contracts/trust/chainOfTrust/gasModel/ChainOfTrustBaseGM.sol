// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../../../common/BaseRelayRecipient.sol";
import "../generic/ChainOfTrustBase.sol";

contract ChainOfTrustBaseGM is BaseRelayRecipient, ChainOfTrustBase {
    constructor(
        address trustedForwarderAddress,
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer
    )
        BaseRelayRecipient(trustedForwarderAddress)
        ChainOfTrustBase(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer
        )
    {}

    /**
     * return the sender of this call.
     * if the call came through our Relay Hub, return the original sender.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _msgSender()
        internal
        view
        virtual
        override(ChainOfTrustBase, BaseRelayRecipient)
        returns (address sender)
    {
        return BaseRelayRecipient._msgSender();
    }
}
