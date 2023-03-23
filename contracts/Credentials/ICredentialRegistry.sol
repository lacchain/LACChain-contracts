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
    function registerChange(bytes32 digest, uint256 iat, uint256 exp) external;

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
    function isValid(
        address issuer,
        bytes32 digest
    ) external view returns (bool);

    event CredentialChange(
        bytes32 indexed digest,
        address by,
        uint iat,
        uint exp
    );
}
