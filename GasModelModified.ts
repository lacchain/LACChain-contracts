import { ethers, Wallet, Transaction } from "ethers";
import { serialize } from "@ethersproject/transactions";
import { BytesLike } from "@ethersproject/bytes";
import { ExternallyOwnedAccount } from "@ethersproject/abstract-signer";
import { SigningKey } from "@ethersproject/signing-key";
import {
  Provider,
  TransactionRequest,
  TransactionResponse,
} from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";

export class GasModelSignerModified extends Wallet {
  private readonly nodeAddress: string;
  private readonly expiration: number;

  constructor(
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    provider: Provider,
    nodeAddress: string,
    expiration: number
  ) {
    super(privateKey, provider);
    this.nodeAddress = nodeAddress;
    this.expiration = expiration;
  }

  // Populates all fields in a transaction, signs it and sends it to the network
  async sendTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<TransactionResponse> {
    this._checkProvider("sendTransaction");
    const tx = await this.populateTransaction({
      ...transaction,
    });
    const signedTx = await this.signTransaction(tx);
    const tr = await this.provider.sendTransaction(signedTx);
    const receipt = await tr.wait();
    console.log(
      "address: " + receipt.contractAddress,
      "txHash:",
      receipt.transactionHash
    );
    return tr;
  }

  signTransaction(transaction: TransactionRequest) {
    return ethers.utils
      .resolveProperties(transaction as Transaction)
      .then((tx: Transaction) => {
        if (tx.from !== null) {
          delete tx.from;
        }
        const value = ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256"],
          [this.nodeAddress, this.expiration]
        );

        tx.data = tx.data + value.substring(2);
        tx.chainId = 0;
        const signature = this._signingKey().signDigest(
          ethers.utils.keccak256(serialize(tx))
        );
        return serialize(tx, signature);
      });
  }
}
