import pkg from '../../package.json' with { type: 'json' };
import { loadStorageLayout } from '../lib/storage_layout_diff.js';
import { TASK_COMPILE } from '../task_names.js';
import { filter } from '@solidstate/hardhat-solidstate-utils/filter';
import { HardhatPluginError } from 'hardhat/plugins';
import type { NewTaskActionFunction } from 'hardhat/types/tasks';
import fs from 'node:fs';
import path from 'node:path';

interface TaskActionArguments {
  noCompile: boolean;
}

const action: NewTaskActionFunction<TaskActionArguments> = async (
  args,
  hre,
) => {
  if (!args.noCompile) {
    await hre.tasks.getTask(TASK_COMPILE).run();
  }

  const config = hre.config.storageLayoutDiff;

  const outputDirectory = path.resolve(hre.config.paths.root, config.path);

  if (!outputDirectory.startsWith(hre.config.paths.root)) {
    throw new HardhatPluginError(
      pkg.name,
      'resolved path must be inside of project directory',
    );
  }

  if (outputDirectory === hre.config.paths.root) {
    throw new HardhatPluginError(
      pkg.name,
      'resolved path must not be root directory',
    );
  }

  if (config.clear && fs.existsSync(outputDirectory)) {
    fs.rmdirSync(outputDirectory, { recursive: true });
  }

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  const fullNames = filter(
    Array.from(await hre.artifacts.getAllFullyQualifiedNames()),
    config,
  );

  for (let fullName of fullNames) {
    const storageLayout = await loadStorageLayout(hre, fullName);
    const { storage, types } = storageLayout;

    if (!storage.length) continue;

    const destination =
      path.resolve(outputDirectory, config.flat ? '' : '', fullName) + '.json';

    if (!fs.existsSync(path.dirname(destination))) {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
    }

    fs.writeFileSync(
      destination,
      `${JSON.stringify({ storage, types }, null, config.spacing)}\n`,
    );
  }
};

export default action;
