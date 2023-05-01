//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import "../Common/BaseRelayRecipient.sol";
import "./ICredentialRegistry.sol";

import "../utils/IdentityHandler.sol";

contract CredentialRegistry is
    ICredentialRegistry,
    BaseRelayRecipient,
    IdentityHandler
{
    constructor(
        address trustedForwarderAddress,
        address didRegistry,
        bytes32 delegateType
    )
        BaseRelayRecipient(trustedForwarderAddress)
        IdentityHandler(didRegistry, delegateType)
    {}

    mapping(bytes32 => mapping(address => Detail)) private registers;

    function issue(bytes32 digest, uint256 exp, address identity) external {
        _validateController(_msgSender(), identity);
        _issue(identity, digest, exp);
    }

    function _issue(address by, bytes32 digest, uint256 exp) private {
        Detail memory detail = registers[digest][by];
        require(detail.exp < block.timestamp && detail.exp != 0, "IC");
        require(detail.iat == 0 && detail.exp == 0, "RAR");
        uint256 iat = block.timestamp;
        detail.iat = iat;
        if (exp > 0) {
            // just skipping exp if zero, to save gas
            detail.exp = exp;
        }

        registers[digest][by] = detail;
        emit NewIssuance(digest, by, iat, exp);
    }

    function revoke(bytes32 digest, address identity) external {
        _validateController(_msgSender(), identity);
        _revoke(_msgSender(), digest);
    }

    function onHoldChange(
        bytes32 digest,
        address identity,
        bool onHoldStatus
    ) external {
        _validateController(_msgSender(), identity);
        _onHoldChange(_msgSender(), digest, onHoldStatus);
    }

    function _onHoldChange(
        address by,
        bytes32 digest,
        bool onHoldStatus
    ) private {
        uint256 currentTime = block.timestamp;
        Detail storage detail = registers[digest][by];
        require(detail.exp > currentTime || detail.exp == 0, "ER");
        require(detail.onHold != onHoldStatus, "IOHCS");
        detail.onHold = onHoldStatus;
        emit NewOnHoldChange(digest, by, onHoldStatus, currentTime);
    }

    function _revoke(address by, bytes32 digest) private {
        uint256 exp = block.timestamp;
        Detail storage detail = registers[digest][by];
        require(detail.exp > exp || detail.exp == 0, "ER");
        detail.exp = exp;
        emit NewRevocation(digest, by, detail.iat, exp);
    }

    function getDetails(
        address issuer,
        bytes32 digest
    ) external view returns (uint256 iat, uint256 exp, bool onHold) {
        Detail memory detail = registers[digest][issuer];
        iat = detail.iat;
        exp = detail.exp;
        onHold = detail.onHold;
    }

    function isValidCredential(
        address issuer,
        bytes32 digest
    ) external view returns (bool value) {
        Detail memory detail = registers[digest][issuer];
        uint256 exp = detail.exp;
        value = !((exp < block.timestamp && exp > 0) || detail.onHold);
    }

    function issueByDelegate(
        address identity,
        bytes32 digest,
        uint256 exp
    ) external {
        // resolve didRegistry to call
        address registryAddress = getDidRegistry(identity);
        _validateDelegate(
            registryAddress,
            identity,
            defaultDelegateType,
            _msgSender()
        );
        _issue(identity, digest, exp);
    }

    function issueByDelegateWithCustomType(
        bytes32 delegateType,
        address identity,
        bytes32 digest,
        uint256 exp
    ) external {
        _validateDelegateWithCustomType(delegateType, identity);
        _issue(identity, digest, exp);
    }

    function issueSigned(
        bytes32 digest,
        uint256 exp,
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS
    ) external {
        // compute hash
        bytes memory message = abi.encode(digest, exp, identity, getChainId());
        message = abi.encode(bytes1(0x19), bytes1(0), this, message);
        bytes32 hashData = keccak256(message);
        address didRegistry = getDidRegistry(identity);
        checkControllerSignature(
            didRegistry,
            identity,
            sigV,
            sigR,
            sigS,
            hashData
        );
        _issue(identity, digest, exp);
    }

    function revokeByDelegate(address identity, bytes32 digest) external {
        address registryAddress = getDidRegistry(identity);
        _validateDelegate(
            registryAddress,
            identity,
            defaultDelegateType,
            _msgSender()
        );
        _revoke(identity, digest);
    }

    function revokeByDelegateWithCustomType(
        bytes32 delegateType,
        address identity,
        bytes32 digest
    ) external {
        _validateDelegateWithCustomType(delegateType, identity);
        _revoke(identity, digest);
    }

    function onHoldByDelegate(
        address identity,
        bytes32 digest,
        bool onHoldStatus
    ) external {
        // resolve didRegistry to call
        address registryAddress = getDidRegistry(identity);
        _validateDelegate(
            registryAddress,
            identity,
            defaultDelegateType,
            _msgSender()
        );
        _onHoldChange(identity, digest, onHoldStatus);
    }

    function onHoldByDelegateWithCustomType(
        bytes32 delegateType,
        address identity,
        bytes32 digest,
        bool onHoldStatus
    ) external {
        _validateDelegateWithCustomType(delegateType, identity);
        _onHoldChange(identity, digest, onHoldStatus);
    }
}
