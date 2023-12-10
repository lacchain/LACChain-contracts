// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./AbstractChainOfTrustUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract ChainOfTrustBaseUpgradeable is
    Initializable,
    AbstractChainOfTrustUpgradeable,
    UUPSUpgradeable
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
        bool rootMaintainer
    ) public initializer {
        __AbstractChainOfTrustUpgradeable_init(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer
        );
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
}
