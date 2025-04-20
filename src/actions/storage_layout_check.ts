import {
  collateStorageLayout,
  getRawStorageLayout,
  mergeCollatedSlots,
  printMergedCollatedSlots,
} from '../lib/storage_layout_diff.js';
import { NewTaskActionFunction } from 'hardhat/types/tasks';
import fs from 'node:fs';

interface StorageLayoutCheckTaskActionArguments {
  source: string;
  b: string;
  bRef: string;
}

const action: NewTaskActionFunction<
  StorageLayoutCheckTaskActionArguments
> = async (args, hre) => {
  // TODO: import task name constant
  await hre.tasks.getTask('compile').run();

  const slotsA = collateStorageLayout(
    JSON.parse(fs.readFileSync(args.source, 'utf-8')),
  );
  const slotsB = collateStorageLayout(
    await getRawStorageLayout(hre, args.b, args.bRef),
  );

  const mergedSlots = mergeCollatedSlots(slotsA, slotsB);

  printMergedCollatedSlots(mergedSlots);
};

export default action;
