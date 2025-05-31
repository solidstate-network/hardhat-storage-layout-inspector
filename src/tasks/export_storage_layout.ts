import { TASK_EXPORT_STORAGE_LAYOUT } from '../task_names.js';
import { task } from 'hardhat/config';

export default task(TASK_EXPORT_STORAGE_LAYOUT)
  .setDescription('Export storage layouts to files')
  .addFlag({
    name: 'noCompile',
    description: "Don't compile before running this task",
  })
  .setAction(import.meta.resolve('../actions/export_storage_layout.js'))
  .build();
