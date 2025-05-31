import type { CollatedSlot, MergedCollatedSlot } from '../types.js';
import { createTable } from '@solidstate/hardhat-solidstate-utils/table';
import chalk from 'chalk';

const visualizeSlot = (offset: number, size: number, slotFill: number) => {
  const chars = {
    filled: '▰',
    placeholder: '▱',
    empty: ' ',
  };

  return (
    chars.empty.repeat(32 - slotFill) +
    chars.placeholder.repeat(slotFill - size - offset) +
    chars.filled.repeat(size) +
    chars.placeholder.repeat(offset)
  );
};

export const printCollatedSlots = (slots: CollatedSlot[]) => {
  const table = createTable();

  table.push([
    { content: chalk.bold('Slot') },
    { content: chalk.bold('Offset') },
    { content: chalk.bold('Type') },
    { content: chalk.bold('Name') },
    { content: chalk.bold('Visualization') },
  ]);

  for (const slot of slots) {
    for (const entry of slot.entries) {
      const visualization = visualizeSlot(
        entry.offset,
        entry.size,
        slot.sizeFilled,
      );

      table.push([
        { content: slot.id },
        { content: entry.offset },
        { content: entry.type.label },
        { content: entry.name },
        { content: visualization },
      ]);
    }
  }

  console.log(table.toString());
};

export const printMergedCollatedSlots = (slots: MergedCollatedSlot[]) => {
  const table = createTable();

  table.push([
    { content: chalk.bold('Slot') },
    { content: chalk.bold('Offset') },
    { content: chalk.bold('Type') },
    { content: chalk.bold('Name') },
    { content: chalk.bold('Visualization') },
  ]);

  for (const slot of slots) {
    for (const entry of slot.entries) {
      let offset;
      let name;
      let type;

      if (entry.offsetA === entry.offsetB) {
        offset = entry.offsetA;
      } else {
        offset = `${chalk.red(entry.offsetA)} => ${chalk.green(entry.offsetB)}`;
      }

      const nameA = entry.nameA;
      const nameB = entry.nameB;

      if (nameA === nameB) {
        name = nameA;
      } else if (!nameA) {
        name = chalk.green(nameB);
      } else if (!nameB) {
        name = chalk.red(nameA);
      } else {
        name = `${chalk.red(nameA)} => ${chalk.green(nameB)}`;
      }

      const typeLabelA = entry.typeA?.label;
      const typeLabelB = entry.typeB?.label;

      if (typeLabelA === typeLabelB) {
        type = typeLabelA;
      } else if (!typeLabelA) {
        type = chalk.green(typeLabelB);
      } else if (!typeLabelB) {
        type = chalk.red(typeLabelA);
      } else {
        type = `${chalk.red(typeLabelA)} => ${chalk.green(typeLabelB)}`;
      }

      const visualizationA = visualizeSlot(
        entry.offsetA,
        entry.sizeA,
        slot.sizeFilledA,
      );
      const visualizationB = visualizeSlot(
        entry.offsetB,
        entry.sizeB,
        slot.sizeFilledB,
      );

      const visualization = visualizationA
        .split('')
        .map((charA, i) => {
          const charB = visualizationB.charAt(i);

          if (charA === charB) {
            return charA === '▰' ? chalk.magenta(charA) : charA;
          } else if (charA === '▰' || charB === '▰') {
            // one char is filled, and it doesn't matter whether the other is a placeholder or empty
            return charA === '▰' ? chalk.red('▰') : chalk.green('▰');
          } else {
            // chars differ and neither is filled, so one is a placeholder and one is empty
            return '▱';
          }
        })
        .join('');

      table.push([
        { content: slot.id },
        { content: offset },
        { content: type },
        { content: name },
        { content: visualization },
      ]);
    }
  }

  console.log(table.toString());
};
