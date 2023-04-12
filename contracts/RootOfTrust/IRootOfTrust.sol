//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IRootOfTrust {
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
