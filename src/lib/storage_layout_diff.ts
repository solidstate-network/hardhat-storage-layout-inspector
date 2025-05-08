import pkg from '../../package.json';
import { TASK_COMPILE } from '../task_names.js';
import type {
  StorageLayout,
  CollatedSlot,
  StorageElement,
  MergedCollatedSlot,
  MergedCollatedSlotEntry,
} from '../types.js';
import { HardhatPluginError } from 'hardhat/plugins';
import type { HardhatRuntimeEnvironment } from 'hardhat/types/hre';
import assert from 'node:assert';
import child_process from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { simpleGit } from 'simple-git';

export const getTmpHreAtGitRef = async (
  hre: Pick<HardhatRuntimeEnvironment, 'config'>,
  ref: string,
): Promise<HardhatRuntimeEnvironment> => {
  const git = simpleGit(hre.config.paths.root);
  ref = await git.revparse(ref);

  const tmpdir = path.resolve(os.tmpdir(), pkg.name, ref);
  const successfulSetupIndicatorFile = path.resolve(
    tmpdir,
    '.setup_successful',
  );

  if (!fs.existsSync(successfulSetupIndicatorFile)) {
    // delete the directory in case a previous setup failed
    await fs.promises.rm(tmpdir, { recursive: true, force: true });
    await fs.promises.mkdir(tmpdir, { recursive: true });

    try {
      await git.cwd(tmpdir);
      await git.init();
      await git.addRemote('origin', hre.config.paths.root);
      await git.fetch('origin', ref, { '--depth': 1 });
      await git.checkout(ref);

      child_process.spawnSync('npm', ['install'], {
        cwd: tmpdir,
        stdio: 'inherit',
      });

      await fs.promises.writeFile(successfulSetupIndicatorFile, '');
    } catch (error) {
      await fs.promises.rm(tmpdir, { recursive: true, force: true });
      throw new HardhatPluginError(pkg.name, error as string);
    }
  }

  // TODO: fallback to local createHardhatRuntimeEnvironment function
  const { createHardhatRuntimeEnvironment } = await import(
    path.resolve(tmpdir, 'node_modules/hardhat/dist/src/hre')
  );

  const { findClosestHardhatConfig } = await import(
    path.resolve(
      tmpdir,
      'node_modules/hardhat/dist/src/internal/config-loading',
    )
  );

  const tmpConfigPath = await findClosestHardhatConfig(tmpdir);
  const tmpConfig = await import(tmpConfigPath);

  return await createHardhatRuntimeEnvironment(
    tmpConfig.default,
    { config: tmpConfigPath },
    tmpdir,
  );
};

export const loadStorageLayout = async (
  hre: HardhatRuntimeEnvironment,
  contractNameOrFullyQualifiedNameOrFile: string,
): Promise<StorageLayout> => {
  if (path.extname(contractNameOrFullyQualifiedNameOrFile) === '.json') {
    return await getStorageLayoutFromFile(
      contractNameOrFullyQualifiedNameOrFile,
      // TODO: fix file lookup with ref
      // ref,
    );
  } else {
    return await getStorageLayoutFromArtifact(
      hre,
      contractNameOrFullyQualifiedNameOrFile,
    );
  }
};

const getStorageLayoutFromFile = async (
  fileName: string,
  ref?: string,
): Promise<StorageLayout> => {
  let contents;

  try {
    if (ref) {
      // TODO: cwd
      const git = simpleGit();
      contents = await git.show(`${ref}:${fileName}`);
    } else {
      contents = await fs.promises.readFile(fileName, 'utf-8');
    }
  } catch (error) {
    throw new HardhatPluginError(pkg.name, error as string);
  }

  // TODO: validate that JSON is a StorageLayout
  return JSON.parse(contents);
};

const getStorageLayoutFromArtifact = async (
  hre: HardhatRuntimeEnvironment,
  contractNameOrFullyQualifiedName: string,
): Promise<StorageLayout> => {
  const artifact = await hre.artifacts.readArtifact(
    contractNameOrFullyQualifiedName,
  );

  const buildInfoPath = await hre.artifacts.getBuildInfoOutputPath(
    artifact.buildInfoId!,
  );

  const buildInfo = JSON.parse(
    await fs.promises.readFile(buildInfoPath!, 'utf-8'),
  );

  if (!buildInfo) {
    throw new HardhatPluginError(pkg.name, `contract not found`);
  }

  const { sourceName, contractName } = artifact;

  // TODO: validate that JSON contains a StorageLayout
  return (buildInfo.output.contracts[sourceName][contractName] as any)
    .storageLayout;
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
