import { printMergedCollatedSlots } from '../lib/print.js';
import {
  collateStorageLayout,
  loadStorageLayout,
  mergeCollatedSlots,
} from '../lib/storage_layout_diff.js';
import { TASK_COMPILE } from '../task_names.js';
import { createHardhatRuntimeEnvironmentAtGitRef } from '@solidstate/hardhat-git';
import { NewTaskActionFunction } from 'hardhat/types/tasks';

interface DiffStorageLayoutTaskActionArguments {
  a: string;
  b: string;
  aRef?: string;
  bRef?: string;
  noCompile: boolean;
}

const action: NewTaskActionFunction<
  DiffStorageLayoutTaskActionArguments
> = async (args, hre) => {
  const { aRef, bRef } = args;

  // TODO: npmInstall parameter

  const hreRefA = aRef
    ? await createHardhatRuntimeEnvironmentAtGitRef(hre, aRef)
    : hre;

  const hreRefB =
    bRef === aRef
      ? hreRefA
      : bRef
        ? await createHardhatRuntimeEnvironmentAtGitRef(hre, bRef)
        : hre;

  if (!args.noCompile) {
    await hreRefA.tasks.getTask(TASK_COMPILE).run();

    if (aRef !== bRef) {
      await hreRefB.tasks.getTask(TASK_COMPILE).run();
    }
  }

  const slotsA = collateStorageLayout(await loadStorageLayout(hreRefA, args.a));
  const slotsB = collateStorageLayout(await loadStorageLayout(hreRefB, args.b));

  const mergedSlots = mergeCollatedSlots(slotsA, slotsB);

  printMergedCollatedSlots(mergedSlots);
};

export default action;
