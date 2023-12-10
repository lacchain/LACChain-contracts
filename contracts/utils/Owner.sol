// SPDX-License-Identifier: MIT
// Based on OpenZeppelin Contracts (last updated v4.7.0) (access/Ownable.sol)

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @dev Contract that defines the more generic methods to protect access to certain methods belonging to other 
 contracts inheriting this abstract contract.
 */
abstract contract Owner {
    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address);

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual;
}
