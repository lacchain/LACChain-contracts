// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../IChainOfTrustBase.sol";

import "../../../utils/Ownable.sol";

import "./AbstractCoreChainOfTrust.sol";

import "@openzeppelin/contracts/utils/Context.sol";

contract ChainOfTrustBase is Ownable, AbstractCoreChainOfTrust {
    constructor(
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer
    ) {
        depth = chainDepth;
        memberCounter++;
        revokeConfigMode = revokeMode;
        _configMember(memberCounter, did, rootEntityManager);
        isRootMaintainer = rootMaintainer;
        _emitContractBlockChangeIfNeeded();
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
}
