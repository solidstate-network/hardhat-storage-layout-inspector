import pkg from '../package.json' with { type: 'json' };
import taskStorageLayout from './tasks/storage_layout.js';
import taskStorageLayoutDiff from './tasks/storage_layout_diff.js';
import taskStorageLayoutExport from './tasks/storage_layout_export.js';
import taskStorageLayoutInspect from './tasks/storage_layout_inspect.js';
import './type_extensions';
import type { HardhatPlugin } from 'hardhat/types/plugins';

const plugin: HardhatPlugin = {
  id: pkg.name,
  npmPackage: pkg.name,
  dependencies: [
    async () => (await import('@solidstate/hardhat-solidstate-utils')).default,
    async () => (await import('@solidstate/hardhat-git')).default,
  ],
  tasks: [
    taskStorageLayout,
    taskStorageLayoutDiff,
    taskStorageLayoutExport,
    taskStorageLayoutInspect,
  ],
  hookHandlers: {
    config: import.meta.resolve('./hooks/config.js'),
  },
};

export default plugin;
