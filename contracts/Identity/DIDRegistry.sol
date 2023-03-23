//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.18;

import "./SafeMath.sol";
import "./IDIDRegistry.sol";
import "../Common/BaseRelayRecipient.sol";

contract DIDRegistry is IDIDRegistry, BaseRelayRecipient {
    using SafeMath for uint256;

    mapping(address => address[]) public controllers;
    mapping(address => mapping(bytes32 => mapping(address => uint)))
        public delegates;
    mapping(address => DIDConfig) private configs;
    mapping(address => uint) public changed;
    mapping(address => uint) public nonce;

    uint private minKeyRotationTime;

    constructor(
        uint _minKeyRotationTime,
        address trustedForwarderAddr
    ) BaseRelayRecipient(trustedForwarderAddr) {
        minKeyRotationTime = _minKeyRotationTime;
    }

    modifier onlyController(address identity, address actor) {
        require(actor == identityController(identity), "Not authorized");
        _;
    }

    function getControllers(
        address subject
    ) public view returns (address[] memory) {
        return controllers[subject];
    }

    function identityController(
        address identity
    ) public view returns (address) {
        uint len = controllers[identity].length;
        if (len == 0) return identity;
        if (len == 1) return controllers[identity][0];
        DIDConfig storage config = configs[identity];
        address controller = address(0);
        if (config.automaticRotation) {
            uint currentController = block
                .timestamp
                .div(config.keyRotationTime)
                .mod(len);
            controller = controllers[identity][currentController];
        } else {
            if (config.currentController >= len) {
                controller = controllers[identity][0];
            } else {
                controller = controllers[identity][config.currentController];
            }
        }
        if (controller != address(0)) return controller;
        return identity;
    }

    function checkSignature(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes32 hash
    ) internal returns (address) {
        address signer = ecrecover(hash, sigV, sigR, sigS);
        require(signer == identityController(identity));
        nonce[signer]++;
        return signer;
    }

    function setCurrentController(address identity, uint index) internal {
        DIDConfig storage config = configs[identity];
        config.currentController = index;
    }

    function _getControllerIndex(
        address identity,
        address controller
    ) internal view returns (int) {
        for (uint i = 0; i < controllers[identity].length; i++) {
            if (controllers[identity][i] == controller) {
                return int(i);
            }
        }
        return -1;
    }

    function addController(
        address identity,
        address actor,
        address newController
    ) internal onlyController(identity, actor) {
        int controllerIndex = _getControllerIndex(identity, newController);

        if (controllerIndex < 0) {
            if (controllers[identity].length == 0) {
                controllers[identity].push(identity);
            }
            controllers[identity].push(newController);
        }
    }

    function removeController(
        address identity,
        address actor,
        address controller
    ) internal onlyController(identity, actor) {
        require(
            controllers[identity].length > 1,
            "You need at least two controllers to delete"
        );
        require(
            identityController(identity) != controller,
            "Cannot delete current controller"
        );
        int controllerIndex = _getControllerIndex(identity, controller);

        require(controllerIndex >= 0, "Controller not exist");

        uint len = controllers[identity].length;
        address lastController = controllers[identity][len - 1];
        controllers[identity][uint(controllerIndex)] = lastController;
        if (lastController == identityController(identity)) {
            configs[identity].currentController = uint(controllerIndex);
        }
        delete controllers[identity][len - 1];
        controllers[identity].pop();
    }

    function changeController(
        address identity,
        address actor,
        address newController
    ) internal onlyController(identity, actor) {
        int controllerIndex = _getControllerIndex(identity, newController);

        require(controllerIndex >= 0, "Controller not exist");

        if (controllerIndex >= 0) {
            setCurrentController(identity, uint(controllerIndex));

            emit DIDControllerChanged(
                identity,
                newController,
                changed[identity]
            );
            changed[identity] = block.number;
        }
    }

    function enableKeyRotation(
        address identity,
        address actor,
        uint keyRotationTime
    ) internal onlyController(identity, actor) {
        require(
            keyRotationTime >= minKeyRotationTime,
            "Invalid minimum key rotation time"
        );
        configs[identity].automaticRotation = true;
        configs[identity].keyRotationTime = keyRotationTime;
    }

    function disableKeyRotation(
        address identity,
        address actor
    ) internal onlyController(identity, actor) {
        configs[identity].automaticRotation = false;
    }

    function addController(
        address identity,
        address controller
    ) external override {
        addController(identity, _msgSender(), controller);
    }

    function removeController(
        address identity,
        address controller
    ) external override {
        removeController(identity, _msgSender(), controller);
    }

    function changeController(
        address identity,
        address newController
    ) external override {
        changeController(identity, _msgSender(), newController);
    }

    function changeControllerSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        address newController
    ) external override {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0x19),
                bytes1(0),
                this,
                nonce[identityController(identity)],
                identity,
                "changeController",
                newController
            )
        );
        changeController(
            identity,
            checkSignature(identity, sigV, sigR, sigS, hash),
            newController
        );
    }

    function setAttribute(
        address identity,
        address actor,
        bytes memory name,
        bytes memory value,
        uint validity
    ) internal onlyController(identity, actor) {
        emit DIDAttributeChanged(
            identity,
            name,
            value,
            block.timestamp + validity,
            changed[identity]
        );
        changed[identity] = block.number;
    }

    function setAttribute(
        address identity,
        bytes memory name,
        bytes memory value,
        uint validity
    ) external override {
        setAttribute(identity, _msgSender(), name, value, validity);
    }

    function setAttributeSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes memory name,
        bytes memory value,
        uint validity
    ) external override {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0x19),
                bytes1(0),
                this,
                nonce[identityController(identity)],
                identity,
                "setAttribute",
                name,
                value,
                validity
            )
        );
        setAttribute(
            identity,
            checkSignature(identity, sigV, sigR, sigS, hash),
            name,
            value,
            validity
        );
    }

    function revokeAttribute(
        address identity,
        address actor,
        bytes memory name,
        bytes memory value
    ) internal onlyController(identity, actor) {
        emit DIDAttributeChanged(identity, name, value, 0, changed[identity]);
        changed[identity] = block.number;
    }

    function revokeAttribute(
        address identity,
        bytes memory name,
        bytes memory value
    ) external override {
        revokeAttribute(identity, _msgSender(), name, value);
    }

    function revokeAttributeSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes memory name,
        bytes memory value
    ) external override {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0x19),
                bytes1(0),
                this,
                nonce[identityController(identity)],
                identity,
                "revokeAttribute",
                name,
                value
            )
        );
        revokeAttribute(
            identity,
            checkSignature(identity, sigV, sigR, sigS, hash),
            name,
            value
        );
    }

    function enableKeyRotation(
        address identity,
        uint keyRotationTime
    ) external override {
        enableKeyRotation(identity, _msgSender(), keyRotationTime);
    }

    function disableKeyRotation(address identity) external override {
        disableKeyRotation(identity, _msgSender());
    }

    function validDelegate(
        address identity,
        bytes32 delegateType,
        address delegate
    ) public view returns (bool) {
        uint validity = delegates[identity][
            keccak256(abi.encode(delegateType))
        ][delegate];
        return (validity > block.timestamp);
    }

    function addDelegate(
        address identity,
        address actor,
        bytes32 delegateType,
        address delegate,
        uint validity
    ) internal onlyController(identity, actor) {
        delegates[identity][keccak256(abi.encode(delegateType))][delegate] =
            block.timestamp +
            validity;
        emit DIDDelegateChanged(
            identity,
            delegateType,
            delegate,
            block.timestamp + validity,
            changed[identity]
        );
        changed[identity] = block.number;
    }

    function addDelegate(
        address identity,
        bytes32 delegateType,
        address delegate,
        uint validity
    ) public {
        addDelegate(identity, msg.sender, delegateType, delegate, validity);
    }

    function addDelegateSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes32 delegateType,
        address delegate,
        uint validity
    ) public {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0x19),
                bytes1(0),
                this,
                nonce[identityController(identity)],
                identity,
                "addDelegate",
                delegateType,
                delegate,
                validity
            )
        );
        addDelegate(
            identity,
            checkSignature(identity, sigV, sigR, sigS, hash),
            delegateType,
            delegate,
            validity
        );
    }

    function revokeDelegate(
        address identity,
        address actor,
        bytes32 delegateType,
        address delegate
    ) internal onlyController(identity, actor) {
        delegates[identity][keccak256(abi.encode(delegateType))][
            delegate
        ] = block.timestamp;
        emit DIDDelegateChanged(
            identity,
            delegateType,
            delegate,
            block.timestamp,
            changed[identity]
        );
        changed[identity] = block.number;
    }

    function revokeDelegate(
        address identity,
        bytes32 delegateType,
        address delegate
    ) public {
        revokeDelegate(identity, msg.sender, delegateType, delegate);
    }

    function revokeDelegateSigned(
        address identity,
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes32 delegateType,
        address delegate
    ) public {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0x19),
                bytes1(0),
                this,
                nonce[identityController(identity)],
                identity,
                "revokeDelegate",
                delegateType,
                delegate
            )
        );
        revokeDelegate(
            identity,
            checkSignature(identity, sigV, sigR, sigS, hash),
            delegateType,
            delegate
        );
    }
}
