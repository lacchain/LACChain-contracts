import { ethers } from "hardhat";
import { keccak256 } from "ethers/lib/utils";

export const getAddressFromDid = (did: string): string => {
  const codedDid = ethers.utils.defaultAbiCoder.encode(["string"], [did]);
  const hash = keccak256(codedDid);
  return hash.substring(26);
};

export const sleep = (seconds: number) =>
  new Promise((resolve, reject) => {
    setTimeout(() => resolve(true), seconds * 1000);
  });
