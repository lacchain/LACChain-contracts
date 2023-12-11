// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../../../../common/upgradeable/BaseRelayRecipientUpgradeable.sol";
import "../../IChainOfTrustBase.sol";
import "../AbstractCoreChainOfTrust.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract AbstractChainOfTrustUpgradeable is
    AbstractCoreChainOfTrust,
    OwnableUpgradeable
{
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
        override(ContextUpgradeable, Ctx)
        returns (address)
    {
        return ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(ContextUpgradeable, Ctx)
        returns (bytes calldata)
    {
        return ContextUpgradeable._msgData();
    }

    function __AbstractChainOfTrustUpgradeable_init(
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer
    ) internal onlyInitializing {
        __AbstractCoreChainOfTrust_init(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer
        );
        __AbstractChainOfTrustUpgradeable_init_unchained();
    }

    function __AbstractChainOfTrustUpgradeable_init_unchained()
        internal
        onlyInitializing
    {
        __Ownable_init();
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}
