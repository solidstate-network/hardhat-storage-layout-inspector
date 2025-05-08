import { printMergedCollatedSlots } from '../lib/print.js';
import {
  collateStorageLayout,
  getTmpHreAtGitRef,
  loadStorageLayout,
  mergeCollatedSlots,
} from '../lib/storage_layout_diff.js';
import { TASK_COMPILE } from '../task_names.js';
import { NewTaskActionFunction } from 'hardhat/types/tasks';

interface DiffStorageLayoutTaskActionArguments {
  a: string;
  b: string;
  aRef?: string;
  bRef?: string;
}

// TODO: noCompile option

const action: NewTaskActionFunction<
  DiffStorageLayoutTaskActionArguments
> = async (args, hre) => {
  const { aRef, bRef } = args;

  const hreRefA = aRef ? await getTmpHreAtGitRef(hre, aRef) : hre;
  const hreRefB =
    bRef === aRef ? hreRefA : bRef ? await getTmpHreAtGitRef(hre, bRef) : hre;

  await hreRefA.tasks.getTask(TASK_COMPILE).run();

  if (aRef !== bRef) {
    await hreRefB.tasks.getTask(TASK_COMPILE).run();
  }

  const slotsA = collateStorageLayout(await loadStorageLayout(hreRefA, args.a));
  const slotsB = collateStorageLayout(await loadStorageLayout(hreRefB, args.b));

  const mergedSlots = mergeCollatedSlots(slotsA, slotsB);

  printMergedCollatedSlots(mergedSlots);
};

export default action;
