import type {
  StorageLayout,
  CollatedSlot,
  StorageElement,
  MergedCollatedSlot,
  MergedCollatedSlotEntry,
  CollatedSlotEntry,
} from '../types.js';
import { validateStorageLayout } from './validation.js';
import { max, min } from '@nomicfoundation/hardhat-utils/bigint';
import { readJsonFile } from '@nomicfoundation/hardhat-utils/fs';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import path from 'node:path';

export const loadStorageLayout = async (
  hre: Pick<HardhatRuntimeEnvironment, 'artifacts' | 'config'>,
  contractNameOrFullyQualifiedNameOrFile: string,
): Promise<StorageLayout> => {
  if (path.extname(contractNameOrFullyQualifiedNameOrFile) === '.json') {
    return await getStorageLayoutFromFile(
      hre,
      contractNameOrFullyQualifiedNameOrFile,
    );
  } else {
    return await getStorageLayoutFromArtifact(
      hre,
      contractNameOrFullyQualifiedNameOrFile,
    );
  }
};

const getStorageLayoutFromFile = async (
  hre: Pick<HardhatRuntimeEnvironment, 'config'>,
  fileName: string,
): Promise<StorageLayout> => {
  // resolve relative path with respect to hardhat project root
  // user path as-is if absolute
  const filePath = path.resolve(hre.config.paths.root, fileName);

  const storageLayout = (await readJsonFile(filePath)) as any;

  validateStorageLayout(storageLayout, filePath);

  return storageLayout;
};

const getStorageLayoutFromArtifact = async (
  hre: Pick<HardhatRuntimeEnvironment, 'artifacts'>,
  contractNameOrFullyQualifiedName: string,
): Promise<StorageLayout> => {
  const artifact = await hre.artifacts.readArtifact(
    contractNameOrFullyQualifiedName,
  );

  const { buildInfoId, sourceName, contractName } = artifact;

  const buildInfoPath = await hre.artifacts.getBuildInfoOutputPath(
    buildInfoId!,
  );

  const buildInfo = (await readJsonFile(buildInfoPath!)) as any;

  const { storageLayout } =
    buildInfo.output.contracts[sourceName][contractName];

  validateStorageLayout(storageLayout, contractNameOrFullyQualifiedName);

  return storageLayout;
};

export const collateStorageLayout = (
  storageLayout: StorageLayout,
): CollatedSlot[] => {
  const { types, storage } = storageLayout;

  type Element = Pick<StorageElement, 'type' | 'label'>;

  const reducer = (slots: CollatedSlot[], element: Element) => {
    // types will only be null if the storage array is empty
    const type = types![element.type];

    let slot = slots[slots.length - 1];

    if (!slot) {
      // create a new slot if none exist
      const layoutOffset = BigInt(storageLayout.storage[0].slot);
      slot = { id: layoutOffset, sizeReserved: 0, sizeFilled: 0, entries: [] };
      slots.push(slot);
    } else if (Number(type.numberOfBytes) + slot.sizeReserved > 32) {
      // create a new slot if current element doesn't fit
      slot = { id: slot.id + 1n, sizeReserved: 0, sizeFilled: 0, entries: [] };
      slots.push(slot);
    }

    if (type.encoding === 'inplace' && (type.members || type.base)) {
      // type is either a struct or a fixed array
      const members: Element[] = [];

      if (type.members) {
        // type is a struct
        for (let i = 0; i < type.members.length; i++) {
          members.push({
            type: type.members[i].type,
            label: `${element.label}.${type.members[i].label}`,
          });
        }
      } else if (type.base) {
        // type is a fixed array
        const [, count] = type.label.match(/.+\[(\d+)\]$/)!;

        for (let i = 0; i < Number(count); i++) {
          members.push({ type: type.base, label: `${element.label}[${i}]` });
        }
      }

      // process the members recursively, operating on the same `slots` array
      members.reduce(reducer, slots);

      // structs and fixed arrays reserve the entirety of their final slots
      // retrieve the slot from the array in case a new one was added during the recursive call
      slots[slots.length - 1].sizeReserved = 32;
    } else {
      // type is a value type, a dynamic array (including bytes and string), or a mapping

      // a dynamic array slot stores the array length using 32 bytes
      // bytes and string have distinct "long" and "short" encodings, but use 32 bytes regardless
      // a mapping slot reserves 32 bytes, but contains no data

      const sizeReserved = Number(type.numberOfBytes);
      const sizeFilled = type.encoding === 'mapping' ? 0 : sizeReserved;

      slot.entries.push({
        name: element.label,
        size: sizeFilled,
        offset: slot.sizeReserved,
        type,
      });

      slot.sizeReserved += sizeReserved;
      slot.sizeFilled += sizeFilled;
    }

    return slots;
  };

  return storage.reduce(reducer, []);
};

export const mergeCollatedStorageLayouts = (
  slotsA: CollatedSlot[],
  slotsB: CollatedSlot[],
): MergedCollatedSlot[] => {
  const output: MergedCollatedSlot[] = [];

  const firstIdA = slotsA[0]?.id ?? -0n;
  const firstIdB = slotsB[0]?.id ?? -0n;
  const lastIdA = slotsA[slotsA.length - 1]?.id ?? -1n;
  const lastIdB = slotsB[slotsB.length - 1]?.id ?? -1n;

  const emptySlot = { id: 0n, sizeReserved: 0, sizeFilled: 0, entries: [] };

  if (firstIdA > firstIdB) {
    const count = min(firstIdA, lastIdB + 1n) - firstIdB;
    const head = Array(Number(count)).fill(emptySlot);
    slotsA = [...head, ...slotsA];
  } else if (firstIdB > firstIdA) {
    const count = min(firstIdB, lastIdA + 1n) - firstIdA;
    const head = Array(Number(count)).fill(emptySlot);
    slotsB = [...head, ...slotsB];
  }

  if (lastIdA < lastIdB) {
    const count = lastIdB - max(firstIdB - 1n, lastIdA);
    const tail = Array(Number(count)).fill(emptySlot);
    slotsA = [...slotsA, ...tail];
  } else if (lastIdB < lastIdA) {
    const count = lastIdA - max(firstIdA - 1n, lastIdB);
    const tail = Array(Number(count)).fill(emptySlot);
    slotsB = [...slotsB, ...tail];
  }

  for (let i = 0; i < slotsA.length; i++) {
    type Entry = Pick<CollatedSlotEntry, 'size' | 'offset'> & {
      name?: string;
      type?: CollatedSlotEntry['type'];
    };

    const slotA = slotsA[i];
    const slotB = slotsB[i];
    const slotAEntries: Entry[] = [...slotA.entries];
    const slotBEntries: Entry[] = [...slotB.entries];

    const mergedEntries: MergedCollatedSlotEntry[] = [];

    let entryIndexA = 0;
    let entryIndexB = 0;
    let entryA: Entry;
    let entryB: Entry;

    while (
      (entryA = slotAEntries[entryIndexA]) &&
      (entryB = slotBEntries[entryIndexB])
    ) {
      const mergedEntry: MergedCollatedSlotEntry = {
        nameA: entryA.name,
        nameB: entryB.name,
        sizeA: entryA.size,
        sizeB: entryB.size,
        offsetA: entryA.offset,
        offsetB: entryB.offset,
        typeA: entryA.type,
        typeB: entryB.type,
      };

      mergedEntries.push(mergedEntry);

      const endA = entryA.size + entryA.offset;
      const endB = entryB.size + entryB.offset;

      if (endA <= endB) entryIndexA++;
      if (endB <= endA) entryIndexB++;
    }

    while ((entryA = slotAEntries[entryIndexA])) {
      const mergedEntry: MergedCollatedSlotEntry = {
        nameA: entryA.name,
        nameB: undefined,
        sizeA: entryA.size,
        sizeB: 0,
        offsetA: entryA.offset,
        offsetB: 0,
        typeA: entryA.type,
        typeB: undefined,
      };

      mergedEntries.push(mergedEntry);

      entryIndexA++;
    }

    while ((entryB = slotBEntries[entryIndexB])) {
      const mergedEntry: MergedCollatedSlotEntry = {
        nameA: undefined,
        nameB: entryB.name,
        sizeA: 0,
        sizeB: entryB.size,
        offsetA: 0,
        offsetB: entryB.offset,
        typeA: undefined,
        typeB: entryB.type,
      };

      mergedEntries.push(mergedEntry);

      entryIndexB++;
    }

    output.push({
      id: slotA.id || slotB.id,
      sizeReservedA: slotA.sizeReserved,
      sizeReservedB: slotB.sizeReserved,
      sizeFilledA: slotA.sizeFilled,
      sizeFilledB: slotB.sizeFilled,
      entries: mergedEntries,
    });
  }

  return output;
};
