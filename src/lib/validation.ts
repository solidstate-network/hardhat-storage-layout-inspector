import pkg from '../../package.json';
import type {
  StorageLayout,
  StorageElement,
  StorageTypes,
  StorageType,
} from '../types.js';
import { HardhatPluginError } from 'hardhat/plugins';
import assert from 'node:assert';

export const validateStorageLayout = (
  storageLayout: StorageLayout,
  source: string,
) => {
  if (!isValidStorageLayout(storageLayout)) {
    throw new HardhatPluginError(pkg.name, `invalid storage layout: ${source}`);
  }
};

const isValidStorageLayout = (storageLayout: StorageLayout): boolean => {
  // Note: this validates object structure but not contents
  try {
    assert(isValidStorage(storageLayout.storage));
    assert(isValidTypes(storageLayout.types));
  } catch (error) {
    return false;
  }

  return true;
};

const isValidStorage = (storage: StorageElement[]): boolean => {
  try {
    assert(storage.every((el) => isValidStorageElement(el)));
  } catch (error) {
    return false;
  }

  return true;
};

const isValidStorageElement = (storageElement: StorageElement): boolean => {
  try {
    assert(typeof storageElement.contract === 'string');
    assert(typeof storageElement.label === 'string');
    assert(typeof storageElement.offset === 'number');
    assert(typeof storageElement.slot === 'string');
    assert(typeof storageElement.type === 'string');
  } catch (error) {
    return false;
  }

  return true;
};

const isValidTypes = (storageTypes: StorageTypes): boolean => {
  if (storageTypes === null) {
    return true;
  }

  try {
    assert(Object.values(storageTypes).every((el) => isValidStorageType(el)));
  } catch (error) {
    return false;
  }

  return true;
};

const isValidStorageType = (storageType: StorageType): boolean => {
  try {
    assert(
      ['inplace', 'mapping', 'dynamic_array'].includes(storageType.encoding),
    );
    assert(typeof storageType.label === 'string');

    if (typeof storageType.base !== 'undefined') {
      assert(typeof storageType.base === 'string');
    }

    if (typeof storageType.members !== 'undefined') {
      assert(storageType.members.every((el) => isValidStorageElement(el)));
    }
  } catch (error) {
    return false;
  }

  return true;
};
