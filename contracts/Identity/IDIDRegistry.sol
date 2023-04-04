//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.18;

interface IDIDRegistry {
    struct DIDConfig {
        uint currentController;
        bool automaticRotation;
        uint keyRotationTime;
    }

    event DIDControllerChanged(
        address indexed identity,
        address controller,
        uint previousChange
    );

    event DIDAttributeChanged(
        address indexed identity,
        bytes name,
        bytes value,
        uint validTo,
        uint changeTime,
        uint previousChange,
        bool reason
    );

    event DIDDelegateChanged(
        address indexed identity,
        bytes32 delegateType,
        address delegate,
        uint validTo,
        uint changeTime,
        uint previousChange,
        bool reason
    );

    function addController(address identity, address controller) external;

    function removeController(address identity, address controller) external;

    function changeController(address identity, address newController) external;

    function changeControllerSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        address newController
    ) external;

    function setAttribute(
        address identity,
        bytes memory name,
        bytes memory value,
        uint validity
    ) external;

    function setAttributeSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes memory name,
        bytes memory value,
        uint validity
    ) external;

    function revokeAttribute(
        address identity,
        bytes memory name,
        bytes memory value,
        uint256 revokeDeltaTime,
        bool compromised
    ) external;

    function revokeAttributeSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes memory name,
        bytes memory value,
        uint256 revokeDeltaTime,
        bool compromised
    ) external;

    function enableKeyRotation(address identity, uint keyRotationTime) external;

    function disableKeyRotation(address identity) external;
}
