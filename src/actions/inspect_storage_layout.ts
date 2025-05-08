import { printCollatedSlots } from '../lib/print.js';
import {
  collateStorageLayout,
  getTmpHreAtGitRef,
  loadStorageLayout,
} from '../lib/storage_layout_diff.js';
import { TASK_COMPILE } from '../task_names.js';
import { NewTaskActionFunction } from 'hardhat/types/tasks';

interface InspectStorageLayoutTaskActionArguments {
  contract: string;
  ref?: string;
  noCompile: boolean;
}

const action: NewTaskActionFunction<
  InspectStorageLayoutTaskActionArguments
> = async (args, hre) => {
  if (args.ref) {
    // TODO: initialize hre with plugin or user config containing storageLayout output selection
    hre = await getTmpHreAtGitRef(hre, args.ref);
  }

  if (!args.noCompile) {
    await hre.tasks.getTask(TASK_COMPILE).run();
  }

  const slots = collateStorageLayout(
    await loadStorageLayout(hre, args.contract),
  );

  printCollatedSlots(slots);
};

export default action;
