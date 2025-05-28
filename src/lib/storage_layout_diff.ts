import pkg from '../../package.json';
import type {
  StorageLayout,
  CollatedSlot,
  StorageElement,
  MergedCollatedSlot,
  MergedCollatedSlotEntry,
} from '../types.js';
import { validateStorageLayout } from './validation.js';
import { readJsonFile } from '@nomicfoundation/hardhat-utils/fs';
import { HardhatPluginError } from 'hardhat/plugins';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import assert from 'node:assert';
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

  const buildInfoPath = await hre.artifacts.getBuildInfoOutputPath(
    artifact.buildInfoId!,
  );

  const buildInfo = (await readJsonFile(buildInfoPath!)) as any;

  if (!buildInfo) {
    throw new HardhatPluginError(pkg.name, 'contract not found');
  }

  const { sourceName, contractName } = artifact;

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
    const type = types[element.type];

    let slot = slots[slots.length - 1];

    if (!slot) {
      // create a new slot if none exist
      // TODO: custom layout feature allows first slot to be > 0
      slot = { id: 0n, sizeReserved: 0, sizeFilled: 0, entries: [] };
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
      // type is a value type, a dynamic array, or a mapping

      // a dynamic array slot stores the array length using 32 bytes
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

export const mergeCollatedSlots = (
  slotsA: CollatedSlot[],
  slotsB: CollatedSlot[],
): MergedCollatedSlot[] => {
  // TODO: support starting from slot > 0
  // TODO: must use bigint or string for custom layouts

  // TODO: support different lengths
  assert.equal(slotsA.length, slotsB.length);

  const output: MergedCollatedSlot[] = [];

  for (let i = 0; i < slotsA.length; i++) {
    const slotA = slotsA[i];
    const slotB = slotsB[i];

    assert.equal(slotA.id, slotB.id);

    const mergedEntries: MergedCollatedSlotEntry[] = [];

    let entryIndexA = 0;
    let entryIndexB = 0;
    let entryA;
    let entryB;

    while (
      (entryA = slotA.entries[entryIndexA]) &&
      (entryB = slotB.entries[entryIndexB])
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

    // TODO: add tail entries

    output.push({
      id: slotA.id,
      sizeReservedA: slotA.sizeReserved,
      sizeReservedB: slotB.sizeReserved,
      sizeFilledA: slotA.sizeFilled,
      sizeFilledB: slotB.sizeFilled,
      entries: mergedEntries,
    });
  }

  return output;
};
