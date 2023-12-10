// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../../../../common/upgradeable/BaseRelayRecipientUpgradeable.sol";

import "../../IPublicDirectory.sol";

contract CorePublicDirectoryUpgradeable is
    OwnableUpgradeable,
    IPublicDirectory
{
    // ######################## CORE METHODS ######################################## //
    uint16 public constant version = 1;
    mapping(uint256 => member) public memberDetails;
    mapping(address => uint256) public id;
    uint256 public memberCounter;

    /**
     * @dev Allows efficient lookup of all members made in this contract.
     */
    uint256 public contractPrevBlock;
    mapping(uint256 => mapping(address => bool)) public isCot;
    /**
     * memberId -> blockNumber: Maps the last value at which there was a change related to an entity
     */
    mapping(uint256 => uint256) public changed;

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
            changed[memberId]
        );
        _updateBlockPointers(memberId);
    }

    function _emitContractBlockChangeIfNeeded() private {
        if (contractPrevBlock == block.number) return;
        emit ContractChange(contractPrevBlock);
        contractPrevBlock = block.number;
    }

    function _updateBlockPointers(uint256 memberId) private {
        changed[memberId] = block.number;
        _emitContractBlockChangeIfNeeded();
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
        _updateBlockPointers(memberId);
    }

    function _addCoTAddress(address cotAddress, uint256 memberId) private {
        require(!isCot[memberId][cotAddress], "CAA");
        isCot[memberId][cotAddress] = true;
        emit CoTChange(cotAddress, memberId, true, changed[memberId]);
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
        emit CoTChange(cotAddress, memberId, false, changed[memberId]);
        _updateBlockPointers(memberId);
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
        _updateBlockPointers(memberId);
    }

    function _associateDid(string memory did, uint256 memberId) private {
        address didAddr = _computeAddress(did);
        require(id[didAddr] == 0, "DAE");
        id[didAddr] = memberId;
        emit DidAssociated(did, memberId, changed[memberId]);
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
        emit DidDisassociated(didToDisassociate, memberId, changed[memberId]);
        _updateBlockPointers(memberId);
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
            changed[memberId]
        );
        _updateBlockPointers(memberId);
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
            changed[memberId]
        );
        _updateBlockPointers(memberId);
    }

    function getMemberDetails(
        string memory did
    ) public view returns (fullDetails memory foundMember) {
        address didAddr = _computeAddress(did);
        uint256 memberId = id[didAddr];
        member memory m = memberDetails[memberId];
        foundMember.memberData = m;
        foundMember.memberId = memberId;
        foundMember.lastBlockChange = changed[memberId];
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

    // ########################################################################################## //

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[45] private __gap;
}
