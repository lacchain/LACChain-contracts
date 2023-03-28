// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../Common/BaseRelayRecipient.sol";

contract PKD is BaseRelayRecipient {
    constructor(
        address trustedForwarderAddress
    ) BaseRelayRecipient(trustedForwarderAddress) {}
}
