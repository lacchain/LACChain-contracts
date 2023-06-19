// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./IPublicDirectory.sol";
import "../utils/Ownable.sol";

contract PublicDirectory is IPublicDirectory, Ownable {
    mapping(uint256 => member) public memberDetails;
    mapping(address => uint256) public id;
    uint256 public memberCounter;
    uint256 public prevBlock;
    mapping(uint256 => mapping(address => bool)) public isCot;

    constructor(
        address trustedForwarderAddress
    ) BaseRelayRecipient(trustedForwarderAddress) {}

    function addMember(setMember memory _member) external onlyOwner {
        memberCounter++;
        uint256 memberId = memberCounter;
        _associateDid(_member.did, memberId);

        uint256 currentTimestamp = block.timestamp;
        member storage m = memberDetails[memberId];
        m.iat = currentTimestamp;

        if (_member.expires) {
            require(_member.exp > block.timestamp, "IET");
            m.exp = _member.exp;
            m.expires = true;
        }

        if (_member.chainOfTrustAddress != address(0)) {
            _addCoTAddress(_member.chainOfTrustAddress, memberId);
        }
        emit MemberChanged(
            memberId,
            _member.did,
            currentTimestamp,
            m.exp,
            _member.expires,
            _member.rawData,
            currentTimestamp,
            prevBlock
        );
        prevBlock = block.number;
    }

    function _validateAddressAndMemberCounter(
        address cotAddress,
        uint256 memberId
    ) private view {
        require(cotAddress != address(0), "IA");
        require(memberCounter >= memberId, "MIdDE");
    }

    function associateCoTAddressByDid(
        address cotAddress,
        string memory did
    ) external onlyOwner {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        _validateAddressAndMemberCounter(cotAddress, memberId);
        _addCoTAddress(cotAddress, memberId);
        prevBlock = block.number;
    }

    function _addCoTAddress(address cotAddress, uint256 memberId) private {
        require(!isCot[memberId][cotAddress], "CAA");
        isCot[memberId][cotAddress] = true;
        emit CoTChange(cotAddress, memberId, true, prevBlock);
    }

    function disassociateCoTAddressByDid(
        address cotAddress,
        string memory did
    ) external onlyOwner {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        _validateAddressAndMemberCounter(cotAddress, memberId);
        require(isCot[memberId][cotAddress], "CNATM");
        isCot[memberId][cotAddress] = false;
        emit CoTChange(cotAddress, memberId, false, prevBlock);
        prevBlock = block.number;
    }

    // many dids may map to the same member description
    function associateDid(
        string memory did,
        string memory didToAssociate
    ) external onlyOwner {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        _validateMemberIdExists(memberId);
        _associateDid(didToAssociate, memberId);
        prevBlock = block.number;
    }

    function _associateDid(string memory did, uint256 memberId) private {
        address didAddr = _computeAddress(did);
        require(id[didAddr] == 0, "DAE");
        id[didAddr] = memberId;
        emit DidAssociated(did, memberId, prevBlock);
    }

    function disassociateDid(
        string memory did,
        string memory didToDisassociate
    ) external onlyOwner {
        address didAddr1 = _computeAddress(did);
        uint256 memberId1 = id[didAddr1];
        address didAddr = _computeAddress(didToDisassociate);
        uint256 memberId = id[didAddr];
        require(memberId1 == memberId, "ALODRPE");
        _validateMemberIdExists(memberId);
        id[didAddr] = 0; // freed up
        emit DidDisassociated(didToDisassociate, memberId, prevBlock);
        prevBlock = block.number;
    }

    function removeMemberByDid(string memory did) external onlyOwner {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        _validateMemberIdExists(memberId);

        member storage memberDetail = memberDetails[memberId];
        uint256 currentTimestamp = block.timestamp;
        memberDetail.exp = currentTimestamp;
        if (!memberDetail.expires) {
            memberDetail.expires = true;
        }
        bytes memory r = "";
        emit MemberChanged(
            memberId,
            did,
            memberDetail.iat,
            currentTimestamp,
            true,
            r,
            currentTimestamp,
            prevBlock
        );
        prevBlock = block.number;
    }

    function updateMemberDetailsByDid(
        setMember memory _member
    ) external onlyOwner {
        address didAddr = _computeAddress(_member.did);
        uint256 memberId = id[didAddr];
        _validateMemberIdExists(memberId);

        uint256 currentTimestamp = block.timestamp;
        member storage m = memberDetails[memberId];
        m.uat = currentTimestamp;
        if (_member.expires) {
            require(_member.exp > block.timestamp, "IET");
            m.exp = _member.exp;
            if (!m.expires) {
                m.expires = true;
            }
        } else {
            if (m.expires) {
                m.expires = false;
                m.exp = 0;
            }
        }

        emit MemberChanged(
            memberId,
            _member.did,
            m.iat,
            m.exp,
            _member.expires,
            _member.rawData,
            currentTimestamp,
            prevBlock
        );
        prevBlock = block.number;
    }

    function getMemberDetails(
        string memory did
    ) public view returns (fullDetails memory foundMember) {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        member memory m = memberDetails[memberId];
        foundMember.memberData = m;
        foundMember.memberId = memberId;
    }

    function _computeAddress(
        string memory txt
    ) private pure returns (address addr) {
        bytes32 h = keccak256(abi.encode((txt)));
        assembly {
            addr := h
        }
    }

    function _validateMemberIdExists(uint256 memberId) private pure {
        require(memberId > 0, "DNR");
    }
}
