# Hardhat Storage Layout Diff

Inspect and compare Solidity smart contract storage layouts.

> Versions of this plugin prior to `1.0.0` were released as `hardhat-storage-layout-diff`, outside of the `@solidstate` namespace.

## Installation

```bash
npm install --save-dev @solidstate/hardhat-storage-layout-diff
# or
yarn add --dev @solidstate/hardhat-storage-layout-diff
```

## Usage

Load plugin in Hardhat config:

```javascript
import HardhatStorageLayoutDiff from '@solidstate/hardhat-storage-layout-diff';

const config: HardhatUserConfig = {
  plugins: [
    HardhatStorageLayoutDiff,
  ],
  storageLayoutDiff: {
    ... // see table for configuration options
  },
};
```

Add configuration under the `storageLayoutDiff` key:

| option    | description                                                                                                | default                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `path`    | path to HTML export directory (relative to Hardhat root)                                                   | `'./storage_layout'`                                           |
| `clear`   | whether to delete old output in `path` on output generation                                                | `false`                                                        |
| `flat`    | whether to flatten output directory (may cause name collisions)                                            | `false`                                                        |
| `only`    | `Array` of `String` matchers used to select included contracts, defaults to all contracts if `length` is 0 | `['^contracts/']` (dependent on Hardhat `paths` configuration) |
| `except`  | `Array` of `String` matchers used to exclude contracts                                                     | `[]`                                                           |
| `spacing` | number of spaces per indentation level of formatted output                                                 | `2`                                                            |

Additional configuration options are provided by [`@solidstate/hardhat-git`](https://www.npmjs.com/package/@solidstate/hardhat-git), which is included as a dependency.

Export storage layouts:

```bash
npx hardhat export-storage-layout
# or
yarn run hardhat export-storage-layout
```

Inspect a contract's storage layout:

```bash
npx hardhat inspect-storage-layout [CONTRACT_IDENTIFIER]
# or
yarn run hardhat inspect-storage-layout [CONTRACT_IDENTIFIER]
```

Compare two contracts:

```bash
npx hardhat diff-storage-layout [CONTRACT_A_IDENTIFIER] [CONTRACT_B_IDENTIFIER]
# or
yarn run hardhat diff-storage-layout [CONTRACT_A_IDENTIFIER] [CONTRACT_B_IDENTIFIER]
```

A contract identifier may be a name, a fully qualified name, or a path to a JSON file containing a storage layout.

Include the optional git ref options to look up a contract identifier at a particular git reference.

## Development

Install dependencies via Yarn:

```bash
yarn install
```

Setup Husky to format code on commit:

```bash
yarn prepare
```
