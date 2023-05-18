// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./IPublicDirectory.sol";
import "../utils/Ownable.sol";

contract PublicDirectory is IPublicDirectory, Ownable {
    mapping(uint256 => member) public memberDetails;
    mapping(address => uint256) public id;
    uint256 public memberCounter;
    uint256 prevBlock;

    constructor(
        address trustedForwarderAddress
    ) BaseRelayRecipient(trustedForwarderAddress) {}

    function addMember(setMember memory _member) external onlyOwner {
        memberCounter++;
        uint256 memberId = memberCounter;
        _associateDid(_member.did, memberId);

        uint256 currentTimestamp = block.timestamp;
        member storage m = memberDetails[memberId];
        m.name = _member.name;
        m.chainOfTrustManager = _member.chainOfTrustManager;
        m.iat = currentTimestamp;

        if (_member.expires) {
            require(_member.exp > block.timestamp, "IET");
            m.exp = _member.exp;
            m.expires = true;
        }
        emit MemberChanged(
            _member.did,
            currentTimestamp,
            m.exp,
            _member.expires,
            currentTimestamp,
            prevBlock
        );
        prevBlock = block.number;
    }

    // many dids may map to the same member description
    function associateDid(
        string memory did,
        uint256 memberId
    ) external onlyOwner {
        _associateDid(did, memberId);
    }

    function _associateDid(string memory did, uint256 memberId) private {
        address didAddr = _computeAddress(did);
        require(id[didAddr] == 0, "DAE");
        id[didAddr] = memberId;
        emit DidAssociated(did, memberId, prevBlock);
        prevBlock = block.number;
    }

    function disassociateDid(string memory did) external onlyOwner {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        require(memberId > 0, "DNR");
        id[didAddr] = 0; // freed up
        emit DidDisassociated(did, memberId, prevBlock);
        prevBlock = block.number;
    }

    function removeMemberByDid(string memory did) external onlyOwner {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        require(memberId > 0, "DNR");

        member storage memberDetail = memberDetails[memberId];
        uint256 currentTimestamp = block.timestamp;
        memberDetail.exp = currentTimestamp;
        memberDetail.expires = true;
        emit MemberChanged(
            did,
            memberDetail.iat,
            currentTimestamp,
            true,
            currentTimestamp,
            prevBlock
        );
        prevBlock = block.number;
    }

    function updateMemberDetails(setMember memory _member) external onlyOwner {
        address didAddr = _computeAddress(_member.did);
        uint256 memberId = id[didAddr];
        require(memberId > 0, "DNR");

        uint256 currentTimestamp = block.timestamp;
        member storage m = memberDetails[memberId];
        if (bytes(_member.name).length > 0) {
            m.name = _member.name;
        }
        if (_member.chainOfTrustManager != address(0)) {
            m.chainOfTrustManager = _member.chainOfTrustManager;
        }
        m.uat = currentTimestamp;
        if (_member.expires) {
            require(_member.exp > block.timestamp, "IET");
            m.exp = _member.exp;
            if (!m.expires) {
                m.expires = true;
            }
        }
        emit MemberChanged(
            _member.did,
            m.iat,
            m.exp,
            _member.expires,
            currentTimestamp,
            prevBlock
        );
        prevBlock = block.number;
    }

    function getMemberDetails(
        string memory did
    ) public view returns (member memory foundMember) {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        foundMember = memberDetails[memberId];
    }

    function _computeAddress(
        string memory txt
    ) private pure returns (address addr) {
        bytes32 h = keccak256(abi.encode((txt)));
        assembly {
            addr := h
        }
    }
}
