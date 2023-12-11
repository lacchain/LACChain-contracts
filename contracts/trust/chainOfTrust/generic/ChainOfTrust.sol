// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/utils/Context.sol";

import "./AbstractDelegatedChainOfTrust.sol";
import "./AbstractCoreChainOfTrust.sol";
import "../../../common/AbstractIdentityHandler.sol";

import "../../../utils/EIP712/EIP712.sol";
import "../../../utils/Ownable.sol";

contract ChainOfTrust is AbstractDelegatedChainOfTrust, EIP712, Ownable {
    constructor(
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer,
        address didRegistry,
        bytes32 delegateType
    ) EIP712("ChainOfTrust", "1") {
        __AbstractDelegatedChainOfTrust_init(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer,
            didRegistry,
            delegateType
        );
    }

    function _msgSender()
        internal
        view
        virtual
        override(Context, Ctx)
        returns (address)
    {
        return Context._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(Context, Ctx)
        returns (bytes calldata)
    {
        return Context._msgData();
    }

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
