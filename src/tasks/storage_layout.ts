import { TASK_STORAGE_LAYOUT } from '../task_names.js';
import { emptyTask } from 'hardhat/config';

export default emptyTask(
  TASK_STORAGE_LAYOUT,
  'Interact with contract storage layouts',
).build();
