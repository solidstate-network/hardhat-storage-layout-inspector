import { loadStorageLayout } from '../src/lib/storage_layout_diff.js';
import hre from 'hardhat';
import assert from 'node:assert';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('loadStorageLayout', () => {
  it('loads storage layout using contract name', async () => {
    const storageLayout = await loadStorageLayout(hre, 'Test');
    assert(storageLayout);
  });

  it('loads storage layout using fully qualified contract name', async () => {
    const storageLayout = await loadStorageLayout(
      hre,
      'contracts/Test.sol:Test',
    );
    assert(storageLayout);
  });

  it('loads storage layout from file', async () => {
    const storageLayout = await loadStorageLayout(
      hre,
      path.resolve(hre.config.paths.root, 'test/Test.json'),
    );
    assert(storageLayout);
  });

  it('throws if storage layout is not found', async () => {
    await assert.rejects(loadStorageLayout(hre, 'NonexistentContract'));
    await assert.rejects(
      loadStorageLayout(hre, 'contracts/Test.sol:NonexistentContract'),
    );
    await assert.rejects(
      loadStorageLayout(
        hre,
        path.resolve(hre.config.paths.root, 'NonexistentContract.json'),
      ),
    );
    await assert.rejects(
      loadStorageLayout(
        hre,
        path.resolve(hre.config.paths.root, 'package.json'),
      ),
    );
  });
});
