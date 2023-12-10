// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../../../../common/upgradeable/BaseRelayRecipientUpgradeable.sol";
import "../../IChainOfTrustBase.sol";
import "./AbstractCoreChainOfTrustUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract AbstractChainOfTrustUpgradeable is
    AbstractCoreChainOfTrustUpgradeable
{
    function __AbstractChainOfTrustUpgradeable_init(
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer
    ) internal onlyInitializing {
        _initVars(
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
