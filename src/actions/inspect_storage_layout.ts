import { printCollatedSlots } from '../lib/print.js';
import {
  collateStorageLayout,
  loadStorageLayout,
} from '../lib/storage_layout_diff.js';
import { NewTaskActionFunction } from 'hardhat/types/tasks';

interface InspectStorageLayoutTaskActionArguments {
  contract: string;
  ref?: string;
}

const action: NewTaskActionFunction<
  InspectStorageLayoutTaskActionArguments
> = async (args, hre) => {
  // TODO: import task name constant
  await hre.tasks.getTask('compile').run();

  const slots = collateStorageLayout(
    await loadStorageLayout(hre, args.contract, args.ref),
  );

  printCollatedSlots(slots);
};

export default action;
