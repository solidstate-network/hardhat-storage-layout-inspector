import { printMergedCollatedSlots } from '../lib/print.js';
import {
  collateStorageLayout,
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
  await hre.tasks.getTask(TASK_COMPILE).run();

  // TODO: check default values of ref parameters
  const slotsA = collateStorageLayout(
    await loadStorageLayout(hre, args.a, args.aRef),
  );
  const slotsB = collateStorageLayout(
    await loadStorageLayout(hre, args.b, args.bRef),
  );

  const mergedSlots = mergeCollatedSlots(slotsA, slotsB);

  printMergedCollatedSlots(mergedSlots);
};

export default action;
