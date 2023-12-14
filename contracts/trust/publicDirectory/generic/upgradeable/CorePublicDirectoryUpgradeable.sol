// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../AbstractCorePublicDirectory.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract CorePublicDirectoryUpgradeable is
    OwnableUpgradeable,
    AbstractCorePublicDirectory
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

    function __CorePublicDirectoryUpgradeable_init() internal onlyInitializing {
        __AbstractCorePublicDirectory_init();
        __CorePublicDirectoryUpgradeable_init_unchained();
    }

    function __CorePublicDirectoryUpgradeable_init_unchained()
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
