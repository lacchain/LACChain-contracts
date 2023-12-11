// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../../../../common/upgradeable/BaseRelayRecipientUpgradeable.sol";
import "../../IChainOfTrustBase.sol";
import "../../generic/upgradeable/AbstractChainOfTrustUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract AbstractChainOfTrustGMUpgradeable is
    BaseRelayRecipientUpgradeable,
    AbstractChainOfTrustUpgradeable
{
    function __AbstractChainOfTrustGMUpgradeable_init(
        address trustedForwarderAddress,
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer
    ) internal onlyInitializing {
        __AbstractChainOfTrustUpgradeable_init(
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer
        );
        __AbstractChainOfTrustGMUpgradeable_init_unchained(
            trustedForwarderAddress
        );
    }

    function __AbstractChainOfTrustGMUpgradeable_init_unchained(
        address trustedForwarderAddress
    ) internal onlyInitializing {
        __BaseRelayRecipient_init(trustedForwarderAddress);
        __Ownable_init();
    }

    /**
     * return the sender of this call.
     * if the call came through our Relay Hub, return the original sender.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _msgSender()
        internal
        view
        virtual
        override(BaseRelayRecipientUpgradeable, AbstractChainOfTrustUpgradeable)
        returns (address sender)
    {
        return BaseRelayRecipientUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(ContextUpgradeable, AbstractChainOfTrustUpgradeable)
        returns (bytes calldata)
    {
        return ContextUpgradeable._msgData();
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}
