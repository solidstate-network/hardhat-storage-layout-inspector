import type {
  StorageLayout,
  CollatedSlot,
  StorageElement,
  MergedCollatedSlot,
  MergedCollatedSlotEntry,
  CollatedSlotEntry,
} from '../types.js';
import { validateStorageLayout } from './validation.js';
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
    const type = types[element.type];

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

export const mergeCollatedStorageLayouts = (
  slotsA: CollatedSlot[],
  slotsB: CollatedSlot[],
): MergedCollatedSlot[] => {
  const output: MergedCollatedSlot[] = [];

  if (slotsA.length !== slotsB.length) {
    const tail: CollatedSlot[] = Array(Math.abs(slotsA.length - slotsB.length));
    tail.fill({ id: 0n, sizeReserved: 0, sizeFilled: 0, entries: [] });

    if (slotsA.length > slotsB.length) {
      slotsB = [...slotsB, ...tail];
    } else if (slotsB.length > slotsA.length) {
      slotsA = [...slotsA, ...tail];
    }
  }

  // TODO: handle non-zero slot indexes
  for (let i = 0; i < slotsA.length; i++) {
    type Entry = Omit<CollatedSlotEntry, 'name'> & { name?: string };

    const slotA = slotsA[i];
    const slotB = slotsB[i];
    const slotAEntries: Entry[] = [...slotA.entries];
    const slotBEntries: Entry[] = [...slotB.entries];

    const tail: Entry[] = [
      ...slotAEntries.slice(slotBEntries.length),
      ...slotBEntries.slice(slotAEntries.length),
    ].map((entry) => ({ size: 0, offset: entry.offset, type: entry.type }));

    if (slotAEntries.length > slotBEntries.length) {
      slotBEntries.push(...tail);
    } else if (slotBEntries.length > slotAEntries.length) {
      slotAEntries.push(...tail);
    }

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

    output.push({
      id: BigInt(i),
      sizeReservedA: slotA.sizeReserved,
      sizeReservedB: slotB.sizeReserved,
      sizeFilledA: slotA.sizeFilled,
      sizeFilledB: slotB.sizeFilled,
      entries: mergedEntries,
    });
  }

  return output;
};
