// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./AbstractChainOfTrustGMUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract ChainOfTrustBaseGMUpgradeable is
    Initializable,
    AbstractChainOfTrustGMUpgradeable,
    UUPSUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address trustedForwarderAddress,
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer
    ) public initializer {
        __AbstractChainOfTrustGMUpgradeable_init(
            trustedForwarderAddress,
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
