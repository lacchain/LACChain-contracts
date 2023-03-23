//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import "../Common/BaseRelayRecipient.sol";
import "./ICredentialRegistry.sol";

contract CredentialRegistry is ICredentialRegistry, BaseRelayRecipient {
    constructor(
        address trustedForwarderAddress
    ) BaseRelayRecipient(trustedForwarder) {}

    mapping(bytes32 => mapping(address => Detail)) private registers;

    function registerChange(bytes32 digest, uint256 iat, uint256 exp) external {
        _registerChange(digest, _msgSender(), iat, exp);
    }

    function _registerChange(
        bytes32 digest,
        address by,
        uint256 iat,
        uint256 exp
    ) private {
        Detail memory detail = registers[digest][by];
        require(detail.exp < block.timestamp && detail.exp != 0, "IC");
        detail.iat = iat;
        detail.exp = exp;
        emit CredentialChange(digest, by, iat, exp);
    }

    function getDetails(
        address issuer,
        bytes32 digest
    ) external view returns (uint256 iat, uint256 exp) {
        Detail memory detail = registers[digest][issuer];
        iat = detail.iat;
        exp = detail.exp;
    }

    function isValid(
        address issuer,
        bytes32 digest
    ) external view returns (bool value) {
        Detail memory detail = registers[digest][issuer];
        uint256 exp = detail.exp;
        value = !(exp < block.timestamp && exp > 0);
    }
}
