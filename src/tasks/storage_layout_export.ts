import { TASK_STORAGE_LAYOUT_EXPORT } from '../task_names.js';
import { task } from 'hardhat/config';

export default task(TASK_STORAGE_LAYOUT_EXPORT)
  .setDescription('Export storage layouts to files')
  .addFlag({
    name: 'noCompile',
    description: "Don't compile before running this task",
  })
  .setAction(() => import('../actions/storage_layout_export.js'))
  .build();
