//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import "../Common/BaseRelayRecipient.sol";
import "./ICredentialRegistry.sol";

contract CredentialRegistry is ICredentialRegistry, BaseRelayRecipient {
    constructor(
        address trustedForwarderAddress,
        address didRegistry,
        bytes32 delegateType
    ) BaseRelayRecipient(trustedForwarderAddress) {
        defaultDidRegistry = didRegistry;
        defaultDelegateType = delegateType;
    }

    bytes32 public defaultDelegateType;
    mapping(bytes32 => mapping(address => Detail)) private registers;
    address public defaultDidRegistry;
    mapping(address => address) public didRegistries;
    // identity => delegateType => bool
    mapping(address => mapping(bytes32 => bool)) public didDelegateTypes;

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

    function revoke(bytes32 digest, uint256 exp, address identity) external {
        _validateController(_msgSender(), identity);
        _revoke(_msgSender(), digest, exp);
    }

    function _revoke(address by, bytes32 digest, uint256 exp) private {
        Detail storage detail = registers[digest][by];
        require(detail.exp < block.timestamp && detail.exp != 0, "ER");
        detail.exp = exp;
        emit NewRevocation(digest, by, detail.iat, exp);
    }

    function getDetails(
        address issuer,
        bytes32 digest
    ) external view returns (uint256 iat, uint256 exp) {
        Detail memory detail = registers[digest][issuer];
        iat = detail.iat;
        exp = detail.exp;
    }

    function isValidCredential(
        address issuer,
        bytes32 digest
    ) external view returns (bool value) {
        Detail memory detail = registers[digest][issuer];
        uint256 exp = detail.exp;
        value = !(exp < block.timestamp && exp > 0);
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

    function _revokeByDelegate(
        address identity,
        bytes32 digest,
        uint256 exp
    ) external {
        address registryAddress = getDidRegistry(identity);
        _validateDelegate(
            registryAddress,
            identity,
            defaultDelegateType,
            _msgSender()
        );
        _revoke(identity, digest, exp);
    }

    function _revokeByDelegateWithCustomType(
        bytes32 delegateType,
        address identity,
        bytes32 digest,
        uint256 exp
    ) external {
        _validateDelegateWithCustomType(delegateType, identity);
        _revoke(identity, digest, exp);
    }

    function _validateDelegate(
        address didRegistry,
        address identity,
        bytes32 delegateType,
        address delegate
    ) private view {
        // call didRegistry by passing the sender and the identity
        (bool success, bytes memory data) = didRegistry.staticcall(
            abi.encodeWithSignature(
                "validDelegate(address,bytes32,address",
                identity,
                delegateType,
                delegate
            )
        );
        require(success && abi.decode(data, (bool)), "ID");
    }

    function _validateController(
        address controller,
        address identity
    ) private view {
        address didRegistry = getDidRegistry(identity);
        // call didRegistry by passing the sender and the identity
        (bool success, bytes memory data) = didRegistry.staticcall(
            abi.encodeWithSignature("identityController(address)", identity)
        );
        require(success && abi.decode(data, (address)) == controller, "IC");
    }

    function _validateDelegateWithCustomType(
        bytes32 delegateType,
        address identity
    ) private view {
        // resolve didRegistry to call
        address registryAddress = getDidRegistry(identity);
        require(isValidDelegateType(identity, delegateType), "DTNS");
        _validateDelegate(
            registryAddress,
            identity,
            delegateType,
            _msgSender()
        );
    }

    function addDidRegistry(address didRegistryAddress) external {
        // @todo add extcodesize and function selector verification
        require(
            didRegistryAddress != address(0) &&
                didRegistries[_msgSender()] == address(0),
            "IP"
        );
        didRegistries[_msgSender()] = didRegistryAddress;
    }

    function removeDidRegistry() external {
        // @todo add extcodesize and function selector verification
        require(didRegistries[_msgSender()] != address(0), "CDNS");
        didRegistries[_msgSender()] = address(0);
    }

    function getDidRegistry(
        address identity
    ) public view returns (address didRegistryAddress) {
        address registryAddress = didRegistries[identity];
        if (registryAddress == address(0)) {
            return defaultDidRegistry;
        }
        return registryAddress;
    }

    function addDelegateType(bytes32 delegateType) external {
        address by = _msgSender();
        _delegateTypeChange(delegateType, by, true);
    }

    function removeDelegateType(bytes32 delegateType) external {
        address by = _msgSender();
        _delegateTypeChange(delegateType, by, false);
    }

    function _delegateTypeChange(
        bytes32 delegateType,
        address by,
        bool status
    ) private {
        require(didDelegateTypes[_msgSender()][delegateType] != status, "DAA");
        didDelegateTypes[_msgSender()][delegateType] = status;
        emit NewDelegateTypeChange(delegateType, by, status);
    }

    function isValidDelegateType(
        address identity,
        bytes32 delegateType
    ) public view returns (bool) {
        return didDelegateTypes[identity][delegateType];
    }
}
