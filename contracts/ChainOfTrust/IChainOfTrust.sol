//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

/**
 * @dev Interface intended to be on top of IChainOfTrustBase whose purpose is to add additional capabilities accoding to a did registry compliant
 * with ERC-1056 by which a delegate can execute some actions on behalf of the main entity.
 */
interface IChainOfTrust {
    function addOrUpdateGroupMemberByDelegate(
        address parentEntity,
        address memberEntity,
        string memory did,
        uint256 period
    ) external;

    function revokeMemberByDelegate(
        address parentEntity,
        address memberEntity,
        string memory did
    ) external;

    function revokeMemberByRootByTheirDelegate(
        address memberEntity,
        string memory did
    ) external;

    function revokeMemberByAnyAncestorByTheirDelegate(
        address parentEntity,
        address memberEntity,
        string memory did
    ) external;
}
