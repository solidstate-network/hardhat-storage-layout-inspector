import { prepareHardhatRuntimeEnvironment } from '../lib/hre.js';
import { printMergedCollatedSlots } from '../lib/print.js';
import {
  collateStorageLayout,
  loadStorageLayout,
  mergeCollatedStorageLayouts,
} from '../lib/storage_layout_diff.js';
import { TASK_COMPILE } from '../task_names.js';
import type { NewTaskActionFunction } from 'hardhat/types/tasks';

interface DiffStorageLayoutTaskActionArguments {
  a: string;
  b: string;
  aRev?: string;
  bRev?: string;
  noCompile: boolean;
}

const action: NewTaskActionFunction<
  DiffStorageLayoutTaskActionArguments
> = async (args, hre) => {
  const { aRev, bRev } = args;

  const hreRevA = aRev
    ? await prepareHardhatRuntimeEnvironment(hre.config, aRev)
    : hre;

  const hreRevB =
    bRev === aRev
      ? hreRevA
      : bRev
        ? await prepareHardhatRuntimeEnvironment(hre.config, bRev)
        : hre;

  if (!args.noCompile && (hreRevA === hre || hreRevB === hre)) {
    await hre.tasks.getTask(TASK_COMPILE).run();
  }

  const slotsA = collateStorageLayout(await loadStorageLayout(hreRevA, args.a));
  const slotsB = collateStorageLayout(await loadStorageLayout(hreRevB, args.b));

  const mergedSlots = mergeCollatedStorageLayouts(slotsA, slotsB);

  printMergedCollatedSlots(mergedSlots);
};

export default action;
