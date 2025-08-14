import hardhatStorageLayoutInspector from './src/index.js';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.29',
  plugins: [hardhatStorageLayoutInspector],
};

export default config;
