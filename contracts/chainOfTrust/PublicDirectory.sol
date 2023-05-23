// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./IPublicDirectory.sol";
import "../utils/Ownable.sol";

contract PublicDirectory is IPublicDirectory, Ownable {
    mapping(uint256 => member) public memberDetails;
    mapping(address => uint256) public id;
    uint256 public memberCounter;
    uint256 prevBlock;
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
        m.name = _member.name;
        m.chainOfTrustManager = _member.chainOfTrustManager;
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
            _member.did,
            currentTimestamp,
            m.exp,
            _member.expires,
            currentTimestamp,
            prevBlock
        );
        prevBlock = block.number;
    }

    function addCoTAddress(
        address cotAddress,
        uint256 memberId
    ) public onlyOwner {
        _validateAddressAndMemberCounter(cotAddress, memberId);
        _addCoTAddress(cotAddress, memberId);
        prevBlock = block.number;
    }

    function _addCoTAddress(address cotAddress, uint256 memberId) private {
        require(!isCot[memberId][cotAddress], "CAA");
        isCot[memberId][cotAddress] = true;
        emit CoTChange(cotAddress, memberId, true, prevBlock);
    }

    function disassociateCoTAddress(
        address cotAddress,
        uint256 memberId
    ) public onlyOwner {
        _validateAddressAndMemberCounter(cotAddress, memberId);
        require(isCot[memberId][cotAddress], "CNATM");
        isCot[memberId][cotAddress] = false;
        emit CoTChange(cotAddress, memberId, false, prevBlock);
        prevBlock = block.number;
    }

    function _validateAddressAndMemberCounter(
        address cotAddress,
        uint256 memberId
    ) private view {
        require(cotAddress != address(0), "IA");
        require(memberCounter >= memberId, "MIdDE");
    }

    function addCoTAddressByDid(
        address cotAddress,
        string memory did
    ) external onlyOwner {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        addCoTAddress(cotAddress, memberId);
    }

    function disassociateCoTAddressByDid(
        address cotAddress,
        string memory did
    ) external onlyOwner {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        disassociateCoTAddress(cotAddress, memberId);
    }

    // many dids may map to the same member description
    function associateDid(
        string memory did,
        uint256 memberId
    ) external onlyOwner {
        _associateDid(did, memberId);
        prevBlock = block.number;
    }

    function _associateDid(string memory did, uint256 memberId) private {
        address didAddr = _computeAddress(did);
        require(id[didAddr] == 0, "DAE");
        id[didAddr] = memberId;
        emit DidAssociated(did, memberId, prevBlock);
    }

    function disassociateDid(string memory did) external onlyOwner {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        _validateMemberIdExists(memberId);
        id[didAddr] = 0; // freed up
        emit DidDisassociated(did, memberId, prevBlock);
        prevBlock = block.number;
    }

    function removeMemberByDid(string memory did) external onlyOwner {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        _validateMemberIdExists(memberId);

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
        _validateMemberIdExists(memberId);

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

    function _validateMemberIdExists(uint256 memberId) private pure {
        require(memberId > 0, "DNR");
    }
}
