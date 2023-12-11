// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./AbstractCorePublicDirectory.sol";
import "../../../utils/Ownable.sol";

contract PublicDirectory is AbstractCorePublicDirectory, Ownable {
    constructor() Ownable() {}

    /**
     * @dev Returns the address of the current owner.
     */
    function owner()
        public
        view
        virtual
        override(Ownable, Owner)
        returns (address)
    {
        return Ownable.owner();
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual override(Ownable, Owner) {
        Ownable._checkOwner();
    }
}
