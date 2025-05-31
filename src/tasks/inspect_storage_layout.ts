import { TASK_INSPECT_STORAGE_LAYOUT } from '../task_names.js';
import { task } from 'hardhat/config';
import { ArgumentType } from 'hardhat/types/arguments';

export default task(TASK_INSPECT_STORAGE_LAYOUT)
  .addPositionalArgument({
    name: 'contract',
    description: 'Contract whose storage layout to inspect',
  })
  .addOption({
    name: 'rev',
    description: 'Git revision where contract is defined',
    defaultValue: undefined,
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
  })
  .addFlag({
    name: 'noCompile',
    description:
      'Do not compile before running this task (not applicable to HREs corresponding to git revisions)',
  })
  .setAction(import.meta.resolve('../actions/inspect_storage_layout.js'))
  .build();
