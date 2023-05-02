// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../Common/BaseRelayRecipient.sol";
import "./IIdentityHandler.sol";
import "./EIP712/EIP712.sol";

abstract contract IdentityHandler is
    IIdentityHandler,
    BaseRelayRecipient,
    EIP712
{
    bytes32 public defaultDelegateType;
    address public defaultDidRegistry;
    mapping(address => address) public didRegistries;
    // identity => delegateType => bool
    mapping(address => mapping(bytes32 => bool)) public didDelegateTypes;

    constructor(
        address didRegistry,
        bytes32 delegateType,
        string memory name
    ) EIP712(name, "1") {
        // version is expected to be updated if new version is released
        defaultDidRegistry = didRegistry;
        defaultDelegateType = delegateType;
    }

    function _getDefaultDidRegistry() internal view returns (address) {
        return defaultDidRegistry;
    }

    function _getDefaultDelegateType() internal view returns (bytes32) {
        return defaultDelegateType;
    }

    function checkControllerSignature(
        address didRegistry,
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes32 hash
    ) internal view returns (address) {
        address signer = ecrecover(hash, sigV, sigR, sigS);
        _validateController(didRegistry, signer, identity);
        return signer;
    }

    function checkDelegateSignature(
        address didRegistry,
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes32 hash,
        bytes32 delegateType
    ) internal view returns (address) {
        address delegate = ecrecover(hash, sigV, sigR, sigS);
        _validateDelegate(didRegistry, identity, delegateType, delegate);
        return delegate;
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

    function _validateDelegate(
        address didRegistry,
        address identity,
        bytes32 delegateType,
        address delegate
    ) internal view {
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
        address didRegistry,
        address controller,
        address identity
    ) internal view {
        // call didRegistry by passing the sender and the identity
        (bool success, bytes memory data) = didRegistry.staticcall(
            abi.encodeWithSignature("identityController(address)", identity)
        );
        require(success && abi.decode(data, (address)) == controller, "IC");
    }

    function _validateDelegateWithCustomType(
        bytes32 delegateType,
        address identity
    ) internal view {
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

    function isValidDelegateType(
        address identity,
        bytes32 delegateType
    ) public view returns (bool) {
        return didDelegateTypes[identity][delegateType];
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
}
