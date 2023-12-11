//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../AbstractDelegatedChainOfTrust.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

contract ChainOfTrustUpgradeable is
    Initializable,
    AbstractDelegatedChainOfTrust,
    UUPSUpgradeable,
    OwnableUpgradeable,
    EIP712Upgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer,
        address didRegistry,
        bytes32 delegateType
    ) public initializer {
        __AbstractDelegatedChainOfTrust_init(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer,
            didRegistry,
            delegateType
        );
        __EIP712_init("ChainOfTrust", "1");
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner()
        public
        view
        virtual
        override(OwnableUpgradeable, Owner)
        returns (address)
    {
        return OwnableUpgradeable.owner();
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner()
        internal
        view
        virtual
        override(OwnableUpgradeable, Owner)
    {
        OwnableUpgradeable._checkOwner();
    }

    function _msgSender()
        internal
        view
        virtual
        override(Ctx, ContextUpgradeable)
        returns (address)
    {
        return ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(Ctx, ContextUpgradeable)
        returns (bytes calldata)
    {
        return ContextUpgradeable._msgData();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
