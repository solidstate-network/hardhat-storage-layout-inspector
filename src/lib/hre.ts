import { createHardhatRuntimeEnvironmentAtGitRef } from '@solidstate/hardhat-git';
import type { HardhatConfig } from 'hardhat/types/config';

export const prepareHardhatRuntimeEnvironment = async (
  originConfig: HardhatConfig,
  ref?: string,
) => {
  // TODO: initialize hre with plugin or user config containing storageLayout output selection

  const hre = await createHardhatRuntimeEnvironmentAtGitRef(originConfig, ref);

  return hre;
};
