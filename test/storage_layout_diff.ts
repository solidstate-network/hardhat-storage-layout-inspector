import {
  collateStorageLayout,
  loadStorageLayout,
} from '../src/lib/storage_layout_diff.js';
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

describe('collateStorageLayout', () => {
  it('collates storage layout by storage slot', async () => {
    const storageLayout = await loadStorageLayout(hre, 'Test');

    const collatedStorageLayout = collateStorageLayout(storageLayout);

    assert.equal(collatedStorageLayout.length, 9);

    assert.partialDeepStrictEqual(collatedStorageLayout, [
      {
        id: 0n,
        sizeReserved: 21,
        sizeFilled: 21,
        entries: new Array(2),
      },
      {
        id: 1n,
        sizeReserved: 32,
        sizeFilled: 16,
        entries: new Array(1),
      },
      {
        id: 2n,
        sizeReserved: 32,
        sizeFilled: 0,
        entries: new Array(1),
      },
      {
        id: 3n,
        sizeReserved: 32,
        sizeFilled: 32,
        entries: new Array(2),
      },
      {
        id: 4n,
        sizeReserved: 32,
        sizeFilled: 32,
        entries: new Array(2),
      },
      {
        id: 5n,
        sizeReserved: 32,
        sizeFilled: 16,
        entries: new Array(1),
      },
      {
        id: 6n,
        sizeReserved: 2,
        sizeFilled: 2,
        entries: new Array(2),
      },
      {
        id: 7n,
        sizeReserved: 32,
        sizeFilled: 4,
        entries: new Array(4),
      },
      {
        id: 8n,
        sizeReserved: 32,
        sizeFilled: 4,
        entries: new Array(4),
      },
    ]);
  });
});
