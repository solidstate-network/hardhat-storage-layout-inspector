import {
  collateStorageLayout,
  loadStorageLayout,
  mergeCollatedStorageLayouts,
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

describe('mergeCollatedStorageLayouts', () => {
  it('merges two empty layouts', async () => {
    const storageLayoutA = await loadStorageLayout(hre, 'SlotsZero');
    const collatedStorageLayoutA = collateStorageLayout(storageLayoutA);
    const storageLayoutB = await loadStorageLayout(hre, 'SlotsZero');
    const collatedStorageLayoutB = collateStorageLayout(storageLayoutB);

    const mergedStorageLayout = mergeCollatedStorageLayouts(
      collatedStorageLayoutA,
      collatedStorageLayoutB,
    );

    assert.equal(mergedStorageLayout.length, 0);
  });

  it('merges layout with empty layout', async () => {
    const storageLayoutA = await loadStorageLayout(hre, 'SlotsZero');
    const collatedStorageLayoutA = collateStorageLayout(storageLayoutA);
    const storageLayoutB = await loadStorageLayout(hre, 'SlotsOne');
    const collatedStorageLayoutB = collateStorageLayout(storageLayoutB);

    const mergedStorageLayoutAB = mergeCollatedStorageLayouts(
      collatedStorageLayoutA,
      collatedStorageLayoutB,
    );

    assert.equal(mergedStorageLayoutAB.length, 1);

    assert.partialDeepStrictEqual(mergedStorageLayoutAB, [
      {
        id: 0n,
        sizeReservedA: 0,
        sizeReservedB: collatedStorageLayoutB[0].sizeReserved,
        sizeFilledA: 0,
        sizeFilledB: collatedStorageLayoutB[0].sizeFilled,
        entries: [
          {
            nameA: undefined,
            nameB: collatedStorageLayoutB[0].entries[0].name,
            sizeA: 0,
            sizeB: collatedStorageLayoutB[0].entries[0].size,
            offsetA: 0,
            offsetB: collatedStorageLayoutB[0].entries[0].offset,
            typeA: undefined,
            typeB: {},
          },
        ],
      },
    ]);

    const mergedStorageLayoutBA = mergeCollatedStorageLayouts(
      collatedStorageLayoutB,
      collatedStorageLayoutA,
    );

    assert.equal(mergedStorageLayoutBA.length, 1);

    assert.partialDeepStrictEqual(mergedStorageLayoutBA, [
      {
        id: 0n,
        sizeReservedA: collatedStorageLayoutB[0].sizeReserved,
        sizeReservedB: 0,
        sizeFilledA: collatedStorageLayoutB[0].sizeFilled,
        sizeFilledB: 0,
        entries: [
          {
            nameA: collatedStorageLayoutB[0].entries[0].name,
            nameB: undefined,
            sizeA: collatedStorageLayoutB[0].entries[0].size,
            sizeB: 0,
            offsetA: collatedStorageLayoutB[0].entries[0].offset,
            offsetB: 0,
            typeA: {},
            typeB: undefined,
          },
        ],
      },
    ]);
  });

  it('merges overlaping layouts with offset at end', async () => {
    const storageLayoutA = await loadStorageLayout(hre, 'SlotsOne');
    const collatedStorageLayoutA = collateStorageLayout(storageLayoutA);
    const storageLayoutB = await loadStorageLayout(hre, 'SlotsTwo');
    const collatedStorageLayoutB = collateStorageLayout(storageLayoutB);

    const mergedStorageLayoutAB = mergeCollatedStorageLayouts(
      collatedStorageLayoutA,
      collatedStorageLayoutB,
    );

    assert.equal(mergedStorageLayoutAB.length, 2);

    assert.partialDeepStrictEqual(mergedStorageLayoutAB, [
      {
        id: 0n,
        sizeReservedA: collatedStorageLayoutA[0].sizeReserved,
        sizeReservedB: collatedStorageLayoutB[0].sizeReserved,
        sizeFilledA: collatedStorageLayoutA[0].sizeFilled,
        sizeFilledB: collatedStorageLayoutB[0].sizeFilled,
        entries: [
          {
            nameA: collatedStorageLayoutA[0].entries[0].name,
            nameB: collatedStorageLayoutB[0].entries[0].name,
            sizeA: collatedStorageLayoutA[0].entries[0].size,
            sizeB: collatedStorageLayoutB[0].entries[0].size,
            offsetA: collatedStorageLayoutA[0].entries[0].offset,
            offsetB: collatedStorageLayoutB[0].entries[0].offset,
            typeA: {},
            typeB: {},
          },
        ],
      },
      {
        id: 1n,
        sizeReservedA: 0,
        sizeReservedB: collatedStorageLayoutB[1].sizeReserved,
        sizeFilledA: 0,
        sizeFilledB: collatedStorageLayoutB[1].sizeFilled,
        entries: [
          {
            nameA: undefined,
            nameB: collatedStorageLayoutB[1].entries[0].name,
            sizeA: 0,
            sizeB: collatedStorageLayoutB[1].entries[0].size,
            offsetA: 0,
            offsetB: collatedStorageLayoutB[1].entries[0].offset,
            typeA: undefined,
            typeB: {},
          },
        ],
      },
    ]);

    const mergedStorageLayoutBA = mergeCollatedStorageLayouts(
      collatedStorageLayoutB,
      collatedStorageLayoutA,
    );

    assert.equal(mergedStorageLayoutBA.length, 2);

    assert.partialDeepStrictEqual(mergedStorageLayoutBA, [
      {
        id: 0n,
        sizeReservedA: collatedStorageLayoutB[0].sizeReserved,
        sizeReservedB: collatedStorageLayoutA[0].sizeReserved,
        sizeFilledA: collatedStorageLayoutB[0].sizeFilled,
        sizeFilledB: collatedStorageLayoutA[0].sizeFilled,
        entries: [
          {
            nameA: collatedStorageLayoutB[0].entries[0].name,
            nameB: collatedStorageLayoutA[0].entries[0].name,
            sizeA: collatedStorageLayoutB[0].entries[0].size,
            sizeB: collatedStorageLayoutA[0].entries[0].size,
            offsetA: collatedStorageLayoutB[0].entries[0].offset,
            offsetB: collatedStorageLayoutA[0].entries[0].offset,
            typeA: {},
            typeB: {},
          },
        ],
      },
      {
        id: 1n,
        sizeReservedA: collatedStorageLayoutB[1].sizeReserved,
        sizeReservedB: 0,
        sizeFilledA: collatedStorageLayoutB[1].sizeFilled,
        sizeFilledB: 0,
        entries: [
          {
            nameA: collatedStorageLayoutB[1].entries[0].name,
            nameB: undefined,
            sizeA: collatedStorageLayoutB[1].entries[0].size,
            sizeB: 0,
            offsetA: collatedStorageLayoutB[1].entries[0].offset,
            offsetB: 0,
            typeA: {},
            typeB: undefined,
          },
        ],
      },
    ]);
  });

  it('merges overlapping layouts with offset at start', async () => {
    const storageLayoutA = await loadStorageLayout(hre, 'SlotsOneOffsetOne');
    const collatedStorageLayoutA = collateStorageLayout(storageLayoutA);
    const storageLayoutB = await loadStorageLayout(hre, 'SlotsTwo');
    const collatedStorageLayoutB = collateStorageLayout(storageLayoutB);

    const mergedStorageLayoutAB = mergeCollatedStorageLayouts(
      collatedStorageLayoutA,
      collatedStorageLayoutB,
    );

    assert.equal(mergedStorageLayoutAB.length, 2);

    assert.partialDeepStrictEqual(mergedStorageLayoutAB, [
      {
        id: 0n,
        sizeReservedA: 0,
        sizeReservedB: collatedStorageLayoutB[1].sizeReserved,
        sizeFilledA: 0,
        sizeFilledB: collatedStorageLayoutB[1].sizeFilled,
        entries: [
          {
            nameA: undefined,
            nameB: collatedStorageLayoutB[0].entries[0].name,
            sizeA: 0,
            sizeB: collatedStorageLayoutB[0].entries[0].size,
            offsetA: 0,
            offsetB: collatedStorageLayoutB[0].entries[0].offset,
            typeA: undefined,
            typeB: {},
          },
        ],
      },
      {
        id: 1n,
        sizeReservedA: collatedStorageLayoutA[0].sizeReserved,
        sizeReservedB: collatedStorageLayoutB[1].sizeReserved,
        sizeFilledA: collatedStorageLayoutA[0].sizeFilled,
        sizeFilledB: collatedStorageLayoutB[1].sizeFilled,
        entries: [
          {
            nameA: collatedStorageLayoutA[0].entries[0].name,
            nameB: collatedStorageLayoutB[1].entries[0].name,
            sizeA: collatedStorageLayoutA[0].entries[0].size,
            sizeB: collatedStorageLayoutB[1].entries[0].size,
            offsetA: collatedStorageLayoutA[0].entries[0].offset,
            offsetB: collatedStorageLayoutB[1].entries[0].offset,
            typeA: {},
            typeB: {},
          },
        ],
      },
    ]);

    const mergedStorageLayoutBA = mergeCollatedStorageLayouts(
      collatedStorageLayoutB,
      collatedStorageLayoutA,
    );

    assert.equal(mergedStorageLayoutBA.length, 2);

    assert.partialDeepStrictEqual(mergedStorageLayoutBA, [
      {
        id: 0n,
        sizeReservedA: collatedStorageLayoutB[0].sizeReserved,
        sizeReservedB: 0,
        sizeFilledA: collatedStorageLayoutB[0].sizeFilled,
        sizeFilledB: 0,
        entries: [
          {
            nameA: collatedStorageLayoutB[0].entries[0].name,
            nameB: undefined,
            sizeA: collatedStorageLayoutB[0].entries[0].size,
            sizeB: 0,
            offsetA: collatedStorageLayoutB[0].entries[0].offset,
            offsetB: 0,
            typeA: {},
            typeB: undefined,
          },
        ],
      },
      {
        id: 1n,
        sizeReservedA: collatedStorageLayoutB[1].sizeReserved,
        sizeReservedB: collatedStorageLayoutA[0].sizeReserved,
        sizeFilledA: collatedStorageLayoutB[1].sizeFilled,
        sizeFilledB: collatedStorageLayoutA[0].sizeFilled,
        entries: [
          {
            nameA: collatedStorageLayoutB[1].entries[0].name,
            nameB: collatedStorageLayoutA[0].entries[0].name,
            sizeA: collatedStorageLayoutB[1].entries[0].size,
            sizeB: collatedStorageLayoutA[0].entries[0].size,
            offsetA: collatedStorageLayoutB[1].entries[0].offset,
            offsetB: collatedStorageLayoutA[0].entries[0].offset,
            typeA: {},
            typeB: {},
          },
        ],
      },
    ]);
  });

  it('merges overlapping layouts with offset at both start and end', async () => {
    const storageLayoutA = await loadStorageLayout(hre, 'SlotsTwo');
    const collatedStorageLayoutA = collateStorageLayout(storageLayoutA);
    const storageLayoutB = await loadStorageLayout(hre, 'SlotsTwoOffsetOne');
    const collatedStorageLayoutB = collateStorageLayout(storageLayoutB);

    const mergedStorageLayoutAB = mergeCollatedStorageLayouts(
      collatedStorageLayoutA,
      collatedStorageLayoutB,
    );

    assert.equal(mergedStorageLayoutAB.length, 3);

    assert.partialDeepStrictEqual(mergedStorageLayoutAB, [
      {
        id: 0n,
        sizeReservedA: collatedStorageLayoutA[0].sizeReserved,
        sizeReservedB: 0,
        sizeFilledA: collatedStorageLayoutA[0].sizeFilled,
        sizeFilledB: 0,
        entries: [
          {
            nameA: collatedStorageLayoutA[0].entries[0].name,
            nameB: undefined,
            sizeA: collatedStorageLayoutA[0].entries[0].size,
            sizeB: 0,
            offsetA: collatedStorageLayoutA[0].entries[0].offset,
            offsetB: 0,
            typeA: {},
            typeB: undefined,
          },
        ],
      },
      {
        id: 1n,
        sizeReservedA: collatedStorageLayoutA[1].sizeReserved,
        sizeReservedB: collatedStorageLayoutB[0].sizeReserved,
        sizeFilledA: collatedStorageLayoutA[1].sizeFilled,
        sizeFilledB: collatedStorageLayoutB[0].sizeFilled,
        entries: [
          {
            nameA: collatedStorageLayoutA[1].entries[0].name,
            nameB: collatedStorageLayoutB[0].entries[0].name,
            sizeA: collatedStorageLayoutA[1].entries[0].size,
            sizeB: collatedStorageLayoutB[0].entries[0].size,
            offsetA: collatedStorageLayoutA[1].entries[0].offset,
            offsetB: collatedStorageLayoutB[0].entries[0].offset,
            typeA: {},
            typeB: {},
          },
        ],
      },
      {
        id: 2n,
        sizeReservedA: 0,
        sizeReservedB: collatedStorageLayoutB[1].sizeReserved,
        sizeFilledA: 0,
        sizeFilledB: collatedStorageLayoutB[1].sizeFilled,
        entries: [
          {
            nameA: undefined,
            nameB: collatedStorageLayoutB[1].entries[0].name,
            sizeA: 0,
            sizeB: collatedStorageLayoutB[1].entries[0].size,
            offsetA: 0,
            offsetB: collatedStorageLayoutB[1].entries[0].offset,
            typeA: undefined,
            typeB: {},
          },
        ],
      },
    ]);

    const mergedStorageLayoutBA = mergeCollatedStorageLayouts(
      collatedStorageLayoutB,
      collatedStorageLayoutA,
    );

    assert.equal(mergedStorageLayoutBA.length, 3);

    assert.partialDeepStrictEqual(mergedStorageLayoutBA, [
      {
        id: 0n,
        sizeReservedA: 0,
        sizeReservedB: collatedStorageLayoutA[0].sizeReserved,
        sizeFilledA: 0,
        sizeFilledB: collatedStorageLayoutA[0].sizeFilled,
        entries: [
          {
            nameA: undefined,
            nameB: collatedStorageLayoutA[0].entries[0].name,
            sizeA: 0,
            sizeB: collatedStorageLayoutA[0].entries[0].size,
            offsetA: 0,
            offsetB: collatedStorageLayoutA[0].entries[0].offset,
            typeA: undefined,
            typeB: {},
          },
        ],
      },
      {
        id: 1n,
        sizeReservedA: collatedStorageLayoutB[0].sizeReserved,
        sizeReservedB: collatedStorageLayoutA[1].sizeReserved,
        sizeFilledA: collatedStorageLayoutB[0].sizeFilled,
        sizeFilledB: collatedStorageLayoutA[1].sizeFilled,
        entries: [
          {
            nameA: collatedStorageLayoutB[0].entries[0].name,
            nameB: collatedStorageLayoutA[1].entries[0].name,
            sizeA: collatedStorageLayoutB[0].entries[0].size,
            sizeB: collatedStorageLayoutA[1].entries[0].size,
            offsetA: collatedStorageLayoutB[0].entries[0].offset,
            offsetB: collatedStorageLayoutA[1].entries[0].offset,
            typeA: {},
            typeB: {},
          },
        ],
      },
      {
        id: 2n,
        sizeReservedA: collatedStorageLayoutB[1].sizeReserved,
        sizeReservedB: 0,
        sizeFilledA: collatedStorageLayoutB[1].sizeFilled,
        sizeFilledB: 0,
        entries: [
          {
            nameA: collatedStorageLayoutB[1].entries[0].name,
            nameB: undefined,
            sizeA: collatedStorageLayoutB[1].entries[0].size,
            sizeB: 0,
            offsetA: collatedStorageLayoutB[1].entries[0].offset,
            offsetB: 0,
            typeA: {},
            typeB: undefined,
          },
        ],
      },
    ]);
  });

  it('merges layouts with no overlap', async () => {
    const storageLayoutA = await loadStorageLayout(hre, 'SlotsTwo');
    const collatedStorageLayoutA = collateStorageLayout(storageLayoutA);
    const storageLayoutB = await loadStorageLayout(hre, 'SlotsTwoOffsetTwo');
    const collatedStorageLayoutB = collateStorageLayout(storageLayoutB);

    const mergedStorageLayoutAB = mergeCollatedStorageLayouts(
      collatedStorageLayoutA,
      collatedStorageLayoutB,
    );

    assert.equal(mergedStorageLayoutAB.length, 4);

    assert.partialDeepStrictEqual(mergedStorageLayoutAB, [
      {
        id: 0n,
        sizeReservedA: collatedStorageLayoutA[0].sizeReserved,
        sizeReservedB: 0,
        sizeFilledA: collatedStorageLayoutA[0].sizeFilled,
        sizeFilledB: 0,
        entries: [
          {
            nameA: collatedStorageLayoutA[0].entries[0].name,
            nameB: undefined,
            sizeA: collatedStorageLayoutA[0].entries[0].size,
            sizeB: 0,
            offsetA: collatedStorageLayoutA[0].entries[0].offset,
            offsetB: 0,
            typeA: {},
            typeB: undefined,
          },
        ],
      },
      {
        id: 1n,
        sizeReservedA: collatedStorageLayoutA[1].sizeReserved,
        sizeReservedB: 0,
        sizeFilledA: collatedStorageLayoutA[1].sizeFilled,
        sizeFilledB: 0,
        entries: [
          {
            nameA: collatedStorageLayoutA[1].entries[0].name,
            nameB: undefined,
            sizeA: collatedStorageLayoutA[1].entries[0].size,
            sizeB: 0,
            offsetA: collatedStorageLayoutA[1].entries[0].offset,
            offsetB: 0,
            typeA: {},
            typeB: undefined,
          },
        ],
      },
      {
        id: 2n,
        sizeReservedA: 0,
        sizeReservedB: collatedStorageLayoutB[0].sizeReserved,
        sizeFilledA: 0,
        sizeFilledB: collatedStorageLayoutB[0].sizeFilled,
        entries: [
          {
            nameA: undefined,
            nameB: collatedStorageLayoutB[0].entries[0].name,
            sizeA: 0,
            sizeB: collatedStorageLayoutB[0].entries[0].size,
            offsetA: 0,
            offsetB: collatedStorageLayoutB[0].entries[0].offset,
            typeA: undefined,
            typeB: {},
          },
        ],
      },
      {
        id: 3n,
        sizeReservedA: 0,
        sizeReservedB: collatedStorageLayoutB[1].sizeReserved,
        sizeFilledA: 0,
        sizeFilledB: collatedStorageLayoutB[1].sizeFilled,
        entries: [
          {
            nameA: undefined,
            nameB: collatedStorageLayoutB[1].entries[0].name,
            sizeA: 0,
            sizeB: collatedStorageLayoutB[1].entries[0].size,
            offsetA: 0,
            offsetB: collatedStorageLayoutB[1].entries[0].offset,
            typeA: undefined,
            typeB: {},
          },
        ],
      },
    ]);

    const mergedStorageLayoutBA = mergeCollatedStorageLayouts(
      collatedStorageLayoutB,
      collatedStorageLayoutA,
    );

    assert.equal(mergedStorageLayoutBA.length, 4);

    assert.partialDeepStrictEqual(mergedStorageLayoutBA, [
      {
        id: 0n,
        sizeReservedA: 0,
        sizeReservedB: collatedStorageLayoutA[0].sizeReserved,
        sizeFilledA: 0,
        sizeFilledB: collatedStorageLayoutA[0].sizeFilled,
        entries: [
          {
            nameA: undefined,
            nameB: collatedStorageLayoutA[0].entries[0].name,
            sizeA: 0,
            sizeB: collatedStorageLayoutA[0].entries[0].size,
            offsetA: 0,
            offsetB: collatedStorageLayoutA[0].entries[0].offset,
            typeA: undefined,
            typeB: {},
          },
        ],
      },
      {
        id: 1n,
        sizeReservedA: 0,
        sizeReservedB: collatedStorageLayoutA[1].sizeReserved,
        sizeFilledA: 0,
        sizeFilledB: collatedStorageLayoutA[1].sizeFilled,
        entries: [
          {
            nameA: undefined,
            nameB: collatedStorageLayoutA[1].entries[0].name,
            sizeA: 0,
            sizeB: collatedStorageLayoutA[1].entries[0].size,
            offsetA: 0,
            offsetB: collatedStorageLayoutA[1].entries[0].offset,
            typeA: undefined,
            typeB: {},
          },
        ],
      },
      {
        id: 2n,
        sizeReservedA: collatedStorageLayoutB[0].sizeReserved,
        sizeReservedB: 0,
        sizeFilledA: collatedStorageLayoutB[0].sizeFilled,
        sizeFilledB: 0,
        entries: [
          {
            nameA: collatedStorageLayoutB[0].entries[0].name,
            nameB: undefined,
            sizeA: collatedStorageLayoutB[0].entries[0].size,
            sizeB: 0,
            offsetA: collatedStorageLayoutB[0].entries[0].offset,
            offsetB: 0,
            typeA: {},
            typeB: undefined,
          },
        ],
      },
      {
        id: 3n,
        sizeReservedA: collatedStorageLayoutB[1].sizeReserved,
        sizeReservedB: 0,
        sizeFilledA: collatedStorageLayoutB[1].sizeFilled,
        sizeFilledB: 0,
        entries: [
          {
            nameA: collatedStorageLayoutB[1].entries[0].name,
            nameB: undefined,
            sizeA: collatedStorageLayoutB[1].entries[0].size,
            sizeB: 0,
            offsetA: collatedStorageLayoutB[1].entries[0].offset,
            offsetB: 0,
            typeA: {},
            typeB: undefined,
          },
        ],
      },
    ]);
  });
});
