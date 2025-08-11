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
  dependencies: () => [
    import('@solidstate/hardhat-solidstate-utils'),
    import('@solidstate/hardhat-git'),
  ],
  tasks: [
    taskStorageLayout,
    taskStorageLayoutDiff,
    taskStorageLayoutExport,
    taskStorageLayoutInspect,
  ],
  hookHandlers: {
    config: () => import('./hooks/config.js'),
  },
};

export default plugin;
