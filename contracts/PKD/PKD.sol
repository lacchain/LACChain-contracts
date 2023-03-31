// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../Common/BaseRelayRecipient.sol";
import "./IPKD.sol";

import "../utils/Ownable.sol";

contract PKD is Ownable, IPKD {
    constructor(
        address trustedForwarderAddress
    ) BaseRelayRecipient(trustedForwarderAddress) {
        prevBlock = block.number; // bock on deployment
    }

    struct TlConfig {
        uint8 depth;
        address didAddress;
        bool status;
    }

    struct TlDetail {
        uint32 iat;
        uint32 exp;
    }

    mapping(address => TlConfig) public config;
    mapping(address => mapping(address => TlDetail)) trustedList;
    uint256 prevBlock;

    function addRootLevelsOfTrust(uint8 depth) external onlyOwner {
        TlConfig storage c = config[address(0)];
        c.depth = depth;
        c.status = true; //~
        // @todo event
    }

    function associateDidWithTl(uint8 depth, string memory didStr) external {
        address tlAddr = _msgSender();
        TlConfig storage c = config[tlAddr];
        c.depth = depth;
        address didAddr = _computeAddress(didStr);
        c.didAddress = didAddr;
        // @todo event
    }

    function approveTlCandidate(address tl) external onlyOwner {
        config[tl].status = true;
    }

    function addRootTl(
        address tl,
        string memory did,
        uint32 exp
    ) external onlyOwner {
        _addTl(address(0), tl, did, exp);
    }

    function addTl(address tl, string memory did, uint32 exp) external {
        address parentTl = _msgSender();
        _isTlOnboarded(parentTl);
        _addTl(parentTl, tl, did, exp);
    }

    function updateTl(address tl, string memory did, uint32 exp) external {
        address parentTl = _msgSender();
        _isTlOnboarded(parentTl);
        _isTlOnboarded(tl);

        address didAddress = _computeAddress(did);
        require(didAddress == config[tl].didAddress); // @todo reuse, add message

        require(exp > uint32(block.timestamp), "IET"); // @todo handle delta instead of exp as absolute time. The same for iat ~~
        TlDetail storage t = trustedList[parentTl][tl];
        require(t.iat > 0, "TLNA");
        t.exp = exp;
        emit PkUpdated(parentTl, tl, did, t.iat, exp, prevBlock);
        prevBlock = block.number;
    }

    function revokeTl(address tl, string memory did) external {
        address didAddress = _computeAddress(did);
        require(didAddress == config[tl].didAddress); // @todo optimize -> reads twice

        address parentTl = _msgSender();
        _isTlOnboarded(parentTl);

        uint32 exp = uint32(block.timestamp);
        TlDetail storage t = trustedList[parentTl][tl];
        require(t.exp > exp || t.exp == uint32(0), "ETL");

        t.exp = exp;

        emit PkRevoked(parentTl, tl, did, exp, prevBlock);
        prevBlock = block.number;
    }

    function _addTl(
        address parentTl,
        address tl,
        string memory did,
        uint32 exp
    ) private onlyOwner {
        _isTlOnboarded(tl);
        address didAddress = _computeAddress(did);
        require(didAddress == config[tl].didAddress); // @todo optimize -> reads twice
        uint32 iat = uint32(block.timestamp);
        require(exp > iat); // @todo add message

        TlDetail storage t = trustedList[parentTl][tl];
        require(t.iat == uint32(0), "TLAA");
        t.iat = iat;
        t.exp = exp;
        emit PkAdded(parentTl, tl, did, iat, exp, prevBlock); // @todo add real prev block
        prevBlock = block.number;
    }

    function _isTlOnboarded(address tl) private view {
        // @todo verify did is set
        require(config[tl].status == true, "TLNO");
    }

    function _computeAddress(
        string memory txt
    ) private pure returns (address addr) {
        bytes32 h = keccak256(abi.encode((txt)));
        assembly {
            addr := mload(add(h, 32))
        }
    }
}
