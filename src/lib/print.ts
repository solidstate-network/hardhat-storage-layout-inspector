import type { CollatedSlot, MergedCollatedSlot } from '../types.js';
import chalk from 'chalk';
import Table from 'cli-table3';

export const visualizeSlot = (
  offset: number,
  size: number,
  slotFill: number,
) => {
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
  const table = new Table({
    style: { head: [], border: [], 'padding-left': 2, 'padding-right': 2 },
    chars: {
      mid: '·',
      'top-mid': '|',
      'left-mid': ' ·',
      'mid-mid': '|',
      'right-mid': '·',
      left: ' |',
      'top-left': ' ·',
      'top-right': '·',
      'bottom-left': ' ·',
      'bottom-right': '·',
      middle: '·',
      top: '-',
      bottom: '-',
      'bottom-mid': '|',
    },
  });

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
  const table = new Table({
    style: { head: [], border: [], 'padding-left': 2, 'padding-right': 2 },
    chars: {
      mid: '·',
      'top-mid': '|',
      'left-mid': ' ·',
      'mid-mid': '|',
      'right-mid': '·',
      left: ' |',
      'top-left': ' ·',
      'top-right': '·',
      'bottom-left': ' ·',
      'bottom-right': '·',
      middle: '·',
      top: '-',
      bottom: '-',
      'bottom-mid': '|',
    },
  });

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

      if (entry.nameA === entry.nameB) {
        name = entry.nameA;
      } else {
        name = `${chalk.red(entry.nameA)} => ${chalk.green(entry.nameB)}`;
      }

      if (entry.typeA.label === entry.typeB.label) {
        type = entry.typeA.label;
      } else if (entry.typeA.numberOfBytes === entry.typeB.numberOfBytes) {
        type = `${chalk.red(entry.typeA.label)} => ${chalk.green(entry.typeB.label)}`;
      } else {
        type = `${chalk.red(entry.typeA.label)} => ${chalk.green(entry.typeB.label)}`;
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
            return chalk.red('▰');
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
