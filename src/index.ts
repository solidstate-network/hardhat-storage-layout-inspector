import pkg from '../package.json';
import taskDiffStorageLayout from './tasks/diff_storage_layout.js';
import taskExportStorageLayout from './tasks/export_storage_layout.js';
import taskInspectStorageLayout from './tasks/inspect_storage_layout.js';
import './type_extensions';
import type { HardhatPlugin } from 'hardhat/types/plugins';

const plugin: HardhatPlugin = {
  id: pkg.name,
  npmPackage: pkg.name,
  dependencies: [
    async () => {
      const { default: HardhatGit } = await import('@solidstate/hardhat-git');
      return HardhatGit;
    },
  ],
  tasks: [
    taskDiffStorageLayout,
    taskExportStorageLayout,
    taskInspectStorageLayout,
  ],
  hookHandlers: {
    config: import.meta.resolve('./hooks/config.js'),
  },
};

export default plugin;
