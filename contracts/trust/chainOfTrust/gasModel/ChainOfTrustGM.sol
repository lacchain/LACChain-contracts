//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../generic/ChainOfTrust.sol";
import "../../../common/BaseRelayRecipient.sol";

contract ChainOfTrustGM is BaseRelayRecipient, ChainOfTrust {
    constructor(
        address trustedForwarderAddress,
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer,
        address didRegistry,
        bytes32 delegateType
    )
        BaseRelayRecipient(trustedForwarderAddress)
        ChainOfTrust(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer,
            didRegistry,
            delegateType
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
        override(ChainOfTrust, BaseRelayRecipient)
        returns (address sender)
    {
        return BaseRelayRecipient._msgSender();
    }
}
