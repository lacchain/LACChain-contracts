// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "../Common/BaseRelayRecipient.sol";
import "./IPKD.sol";

import "../utils/Ownable.sol";

contract PKD is Ownable, IPKD {
    constructor(
        address trustedForwarderAddress,
        uint8 rootDepth,
        string memory did
    ) BaseRelayRecipient(trustedForwarderAddress) {
        _configTl(address(0), did, rootDepth);
    }

    struct TlConfig {
        uint8 depth;
        address didAddress;
        bool status;
    }

    struct TlDetail {
        uint256 iat;
        uint256 exp;
    }

    mapping(address => TlConfig) public config;
    mapping(address => mapping(address => TlDetail)) trustedList;
    uint256 prevBlock; // todo check prevblock logic ~~

    function configRootTl(string memory did, uint8 depth) external onlyOwner {
        _configTl(address(0), did, depth);
    }

    function configTl(uint8 depth, string memory did) external {
        address tlAddr = _msgSender();
        _configTl(tlAddr, did, depth);
    }

    function _configTl(address tlAddr, string memory did, uint8 depth) private {
        TlConfig storage c = config[tlAddr];
        c.depth = depth;
        address didAddr = _computeAddress(did);
        c.didAddress = didAddr;
        emit TlConfigChange(tlAddr, did, depth, prevBlock);
        prevBlock = block.number;
    }

    function approveTlCandidate(address tl) external onlyOwner {
        TlConfig storage c = config[tl];
        require(!c.status, "TLAO");
        config[tl].status = true;
        emit MemberOnboarded(tl, prevBlock);
        prevBlock = block.number;
    }

    function addRootTl(
        address tl,
        string memory did,
        uint256 period
    ) external onlyOwner {
        uint256 exp = _getExp(period);
        _addTl(address(0), tl, did, exp);
    }

    function addTl(address tl, string memory did, uint256 period) external {
        uint256 exp = _getExp(period);
        address parentTl = _msgSender();
        _isTlOnboarded(parentTl);
        _addTl(parentTl, tl, did, exp);
    }

    function updateRootTl(
        address tl,
        string memory did,
        uint256 period
    ) external onlyOwner {
        _updateTl(address(0), tl, did, period);
    }

    function updateTl(address tl, string memory did, uint256 period) external {
        address parentTl = _msgSender();
        _isTlOnboarded(parentTl);
        _updateTl(parentTl, tl, did, period);
    }

    function _updateTl(
        address parentTl,
        address tl,
        string memory did,
        uint256 period
    ) private {
        uint256 exp = _getExp(period);
        _isTlOnboarded(tl);
        _verifyDidMatching(tl, did);

        require(exp > _getTimestamp(), "IET");
        TlDetail storage t = trustedList[parentTl][tl];
        require(t.iat > 0, "TLNA");
        t.exp = exp;
        emit PkUpdated(parentTl, tl, did, t.iat, exp, prevBlock);
        prevBlock = block.number;
    }

    function revokeRootTl(address tl, string memory did) external onlyOwner {
        _revokeTl(address(0), tl, did);
    }

    function revokeTl(address tl, string memory did) external {
        address parentTl = _msgSender();
        _isTlOnboarded(parentTl);
        _revokeTl(parentTl, tl, did);
    }

    function _revokeTl(
        address parentTl,
        address tl,
        string memory did
    ) private {
        _verifyDidMatching(tl, did); // todo analyze if necessary here
        uint256 exp = _getTimestamp();
        TlDetail storage t = trustedList[parentTl][tl];
        require(t.exp > exp || t.exp == uint256(0), "ETL");
        t.exp = exp;
        emit PkRevoked(parentTl, tl, did, exp, prevBlock);
        prevBlock = block.number;
    }

    function _getTimestamp() private view returns (uint256 timestamp) {
        timestamp = block.timestamp;
    }

    function _getExp(uint256 period) private view returns (uint256 exp) {
        uint256 currentTime = _getTimestamp();
        require(type(uint256).max - currentTime >= period, "IP");
        exp = currentTime + period;
    }

    function _addTl(
        address parentTl,
        address tl,
        string memory did,
        uint256 exp
    ) private {
        _isTlOnboarded(tl);
        _verifyDidMatching(tl, did);

        uint256 iat = _getTimestamp();
        require(exp > iat, "IET");

        TlDetail storage t = trustedList[parentTl][tl];
        require(t.iat == uint256(0), "TLAA");
        t.iat = iat;
        t.exp = exp;
        emit PkAdded(parentTl, tl, did, iat, exp, prevBlock);
        prevBlock = block.number;
    }

    function _isTlOnboarded(address tl) private view {
        TlConfig memory t = config[tl];
        require(t.status == true, "TLNO");
    }

    function _verifyDidMatching(address tl, string memory did) private view {
        address didAddress = _computeAddress(did);
        require(didAddress == config[tl].didAddress, "DDMODE");
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
