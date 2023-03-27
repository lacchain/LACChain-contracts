//SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.18;

interface ICredentialRegistry {
    /**
     * @param iat: date at which a data was issued
     * @param exp: date at which the data is expiring
     * @note:
     scenario 1: iat == 0, means a data was never issued via this registry; otherwise issued
     scenario 2: (iat > 0 && exp == 0) || (exp > current time) , means the data is still valid 
     scenario 3: exp < current time && exp !=0, means the data has expired (invalid)
     additionally:
     scenario 3.1: iat = 0 && scenario 3: means a data was never issued but revoked (invalid)
     */
    struct Detail {
        uint256 iat;
        uint256 exp;
    }

    /**
     * Once revoked it will not longer be valid
     */
    function issue(bytes32 digest, uint256 exp, address identity) external;

    function revoke(bytes32 digest, uint256 exp, address identity) external;

    function getDetails(
        address issuer,
        bytes32 digest
    ) external view returns (uint256 iat, uint256 exp);

    /**
     * Just valid relative to the information contained in the contract
     * Validates "scenario 3" which means that data will be invalid when the expiration time has been reached by
     * the current timestamp; this means that the data has just expired because of the time has passed or because
     * the data has been revoked
     */
    function isValidCredential(
        address issuer,
        bytes32 digest
    ) external view returns (bool);

    event NewIssuance(bytes32 indexed digest, address by, uint iat, uint exp);

    /**
     * Adding iat to the log allows verfying if the credential was actually issued onchan in the past(iat>0) or 
     just revoked (iat = 0)
     */
    event NewRevocation(bytes32 indexed digest, address by, uint iat, uint exp);

    /**
     * Optional way to register a data change. In this case the delegate sends the data on behalf of the main actor
     *
     */
    function issueByDelegate(
        address identity,
        bytes32 digest,
        uint256 exp
    ) external;

    function _revokeByDelegate(
        address identity,
        bytes32 digest,
        uint256 exp
    ) external;

    /**
     * @param delegateType: must coincide with some delegate that was registered under the "identity" by using the method "addDelegateType"
     * Optional way to register a data change. In this case the delegate sends the data on behalf of the main actor
     */
    function issueByDelegateWithCustomType(
        bytes32 delegateType,
        address identity,
        bytes32 digest,
        uint256 exp
    ) external;

    function _revokeByDelegateWithCustomType(
        bytes32 delegateType,
        address identity,
        bytes32 digest,
        uint256 exp
    ) external;

    /**
     * Every user is able to just add one didRegistry (address, delegateType).
     * Main identity only can add a didRegistry
     * By adding a didRegistry tied to a user the verification about delegates goes always through that contract
     */
    function addDidRegistry(address didRegistryAddress) external;

    /**
     * removes the custom didRegistry if exists otherwise reverts
     */
    function removeDidRegistry() external;

    /**
     * Returns the didRegistry and delegateType set for an identity
     */
    function getDidRegistry(
        address identity
    ) external view returns (address didRegistryAddress);

    function addDelegateType(bytes32 delegateType) external;

    function removeDelegate(bytes32 delegateType) external;

    function isValidDelegateType(
        address identity,
        bytes32 delegateType
    ) external view returns (bool);
}
