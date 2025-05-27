import { prepareHardhatRuntimeEnvironment } from '../lib/hre.js';
import { printCollatedSlots } from '../lib/print.js';
import {
  collateStorageLayout,
  loadStorageLayout,
} from '../lib/storage_layout_diff.js';
import { TASK_COMPILE } from '../task_names.js';
import type { NewTaskActionFunction } from 'hardhat/types/tasks';

interface InspectStorageLayoutTaskActionArguments {
  contract: string;
  rev?: string;
  noCompile: boolean;
}

const action: NewTaskActionFunction<
  InspectStorageLayoutTaskActionArguments
> = async (args, hre) => {
  if (args.rev) {
    hre = await prepareHardhatRuntimeEnvironment(hre.config, args.rev);
  } else if (!args.noCompile) {
    await hre.tasks.getTask(TASK_COMPILE).run();
  }

  const slots = collateStorageLayout(
    await loadStorageLayout(hre, args.contract),
  );

  printCollatedSlots(slots);
};

export default action;
