//SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

interface IIdentityHandler {
    /**
     * Every entity is able to just add one didRegistry (address).
     * Main identity is the only that that can add a didRegistry only valid for him
     * By adding a didRegistry tied to a entity the verification about delegates goes always through that contract
     */
    function addDidRegistry(address didRegistryAddress) external;

    /**
     * removes the custom didRegistry if exists otherwise reverts
     */
    function removeDidRegistry() external;

    /**
     * Returns the didRegistry and delegateType set for an identity
     */
    function getDidRegistry(
        address identity
    ) external view returns (address didRegistryAddress);

    function addDelegateType(bytes32 delegateType) external;

    function removeDelegateType(bytes32 delegateType) external;

    function isValidDelegateType(
        address identity,
        bytes32 delegateType
    ) external view returns (bool);

    /**
    * if status true, the added delegate type will be valid for just all delegates under "by" (which represents an identifier for the
    main identity)
     */
    event NewDelegateTypeChange(
        bytes32 indexed delegateType,
        address indexed by,
        bool status
    );
}
