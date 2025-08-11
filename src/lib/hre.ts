import pkg from '../../package.json' with { type: 'json' };
import { TASK_COMPILE } from '../task_names.js';
import { createHardhatRuntimeEnvironmentAtGitRev } from '@solidstate/hardhat-git';
import type { HardhatConfig } from 'hardhat/types/config';
import type { HardhatPlugin } from 'hardhat/types/plugins';

export const prepareHardhatRuntimeEnvironment = async (
  originConfig: HardhatConfig,
  rev?: string,
) => {
  // pass in config hooks to ensure that storage layout is inluded in solc
  // output selection even if this plugin was not present at git rev
  const plugin: HardhatPlugin = {
    id: `${pkg.name}_temp`,
    hookHandlers: {
      config: () => import('../hooks/config.js'),
    },
  };

  const hre = await createHardhatRuntimeEnvironmentAtGitRev(originConfig, rev, [
    plugin,
  ]);

  await hre.tasks.getTask(TASK_COMPILE).run();

  return hre;
};
