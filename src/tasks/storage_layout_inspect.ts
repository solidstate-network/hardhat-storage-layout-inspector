import { TASK_STORAGE_LAYOUT_INSPECT } from '../task_names.js';
import { task } from 'hardhat/config';
import { ArgumentType } from 'hardhat/types/arguments';

export default task(TASK_STORAGE_LAYOUT_INSPECT)
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
  .setAction(() => import('../actions/storage_layout_inspect.js'))
  .build();
