import pkg from '../../package.json';
import { TASK_COMPILE } from '../task_names.js';
import { createHardhatRuntimeEnvironmentAtGitRef } from '@solidstate/hardhat-git';
import type { HardhatConfig } from 'hardhat/types/config';
import type { HardhatPlugin } from 'hardhat/types/plugins';

export const prepareHardhatRuntimeEnvironment = async (
  originConfig: HardhatConfig,
  ref?: string,
) => {
  // pass in config hooks to ensure that storage layout is inluded in solc
  // output selection even if this plugin was not present at git ref
  const plugin: HardhatPlugin = {
    id: `${pkg.name}_temp`,
    hookHandlers: {
      config: import.meta.resolve('../hooks/config.js'),
    },
  };

  const hre = await createHardhatRuntimeEnvironmentAtGitRef(originConfig, ref, [
    plugin,
  ]);

  await hre.tasks.getTask(TASK_COMPILE).run();

  return hre;
};
