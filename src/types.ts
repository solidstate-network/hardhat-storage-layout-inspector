export interface StorageLayoutDiffConfig {
  path: string;
  clear: boolean;
  flat: boolean;
  only: string[];
  except: string[];
  spacing: number;
}

export type StorageLayoutDiffUserConfig = Partial<StorageLayoutDiffConfig>;

export type StorageElement = {
  contract: string;
  label: string;
  offset: number;
  slot: string;
  type: string;
};

export type StorageType = {
  encoding: 'inplace' | 'mapping' | 'dynamic_array';
  label: string;
  numberOfBytes: string;
  // `base` is present on array types and represents the type of each array element
  base?: string;
  // `members` is present on struct types and is a list of component types
  members?: StorageElement[];
};

export type StorageTypes = {
  [name: string]: StorageType;
} | null;

export type StorageLayout = {
  storage: StorageElement[];
  types: StorageTypes;
};

export type CollatedSlotEntry = {
  name: string;
  size: number;
  offset: number;
  type: StorageType;
};

export type CollatedSlot = {
  id: bigint;
  sizeReserved: number;
  sizeFilled: number;
  entries: CollatedSlotEntry[];
};

export type MergedCollatedSlotEntry = {
  nameA?: string;
  nameB?: string;
  sizeA: number;
  sizeB: number;
  offsetA: number;
  offsetB: number;
  typeA?: StorageType;
  typeB?: StorageType;
};

export type MergedCollatedSlot = {
  id: bigint;
  sizeReservedA: number;
  sizeReservedB: number;
  sizeFilledA: number;
  sizeFilledB: number;
  entries: MergedCollatedSlotEntry[];
};
