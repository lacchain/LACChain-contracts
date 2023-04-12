// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

abstract contract IdentityChecker {
    bytes32 public defaultDelegateType;
    address public defaultDidRegistry;

    constructor(address didRegistry, bytes32 delegateType) {
        defaultDidRegistry = didRegistry;
        defaultDelegateType = delegateType;
    }

    function _getDefaultDidRegistry() internal view returns (address) {
        return defaultDidRegistry;
    }

    function _getDefaultDelegateType() internal view returns (bytes32) {
        return defaultDelegateType;
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
}
