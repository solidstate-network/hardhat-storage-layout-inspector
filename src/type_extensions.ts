import type {
  StorageLayout,
  StorageLayoutDiffConfig,
  StorageLayoutDiffUserConfig,
} from './types.js';
import 'hardhat/types/config';
import 'hardhat/types/solidity';

declare module 'hardhat/types/config' {
  interface HardhatConfig {
    storageLayoutDiff: StorageLayoutDiffConfig;
  }

  interface HardhatUserConfig {
    storageLayoutDiff?: StorageLayoutDiffUserConfig;
  }
}

declare module 'hardhat/types/solidity' {
  interface CompilerOutputContract {
    storageLayout: StorageLayout;
  }
}
