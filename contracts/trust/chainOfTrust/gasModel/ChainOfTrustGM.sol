//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../../../common/IdentityHandler.sol";
import "./ChainOfTrustBaseGM.sol";
import "../IChainOfTrust.sol";

contract ChainOfTrustGM is ChainOfTrustBaseGM, IdentityHandler, IChainOfTrust {
    constructor(
        address trustedForwarderAddress,
        uint8 chainDepth,
        string memory did,
        address rootEntityManager,
        uint8 revokeMode,
        bool rootMaintainer,
        address didRegistry,
        bytes32 delegateType
    )
        ChainOfTrustBaseGM(
            trustedForwarderAddress,
            chainDepth,
            did,
            rootEntityManager,
            revokeMode,
            rootMaintainer
        )
        IdentityHandler(didRegistry, delegateType, "ChainOfTrust")
    {}

    /**
     * return the sender of this call.
     * if the call came through our Relay Hub, return the original sender.
     * should be used in the contract anywhere instead of msg.sender
     */
    function _msgSender()
        internal
        view
        override(ChainOfTrustBaseGM, Context)
        returns (address sender)
    {
        return ChainOfTrustBaseGM._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(Context, ChainOfTrustBase)
        returns (bytes calldata)
    {
        return Context._msgData();
    }

    function addOrUpdateGroupMemberByDelegate(
        address parentEntity,
        address memberEntity,
        string memory did,
        uint256 period
    ) external {
        _validateDelegate(
            _getDefaultDidRegistry(),
            parentEntity,
            _getDefaultDelegateType(),
            _msgSender()
        );
        _addOrUpdateGroupMember(
            parentEntity,
            memberEntity,
            did,
            _getExp(period)
        );
    }

    function revokeMemberByDelegate(
        address parentEntity,
        address memberEntity,
        string memory did
    ) external {
        _validateDelegate(
            _getDefaultDidRegistry(),
            parentEntity,
            _getDefaultDelegateType(),
            _msgSender()
        );
        _revokeMember(parentEntity, parentEntity, memberEntity, did);
    }

    function revokeMemberByRootByTheirDelegate(
        address memberEntity,
        string memory did
    ) external {
        address actor = manager[1];
        _validateDelegate(
            _getDefaultDidRegistry(),
            actor,
            _getDefaultDelegateType(),
            _msgSender()
        );
        _revokeMemberByRoot(memberEntity, did, actor);
    }

    function revokeMemberByAnyAncestorByTheirDelegate(
        address ancestor,
        address memberEntity,
        string memory did
    ) external {
        _validateDelegate(
            _getDefaultDidRegistry(),
            ancestor,
            _getDefaultDelegateType(),
            _msgSender()
        );
        _revokeMemberByAnyAncestor(ancestor, memberEntity, did);
    }
}
