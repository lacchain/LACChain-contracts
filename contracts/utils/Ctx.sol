// SPDX-License-Identifier: MIT
// Based on OpenZeppelin Contracts (last updated v4.7.0) (access/Ownable.sol)

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @dev Contract that defines the more generic abstract methods to know about the agent interacting with other 
 contracts inheriting this abstract contract.
 */
abstract contract Ctx {
    function _msgSender() internal view virtual returns (address);

    function _msgData() internal view virtual returns (bytes calldata);
}
