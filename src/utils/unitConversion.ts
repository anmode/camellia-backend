type Unit = 'kg' | 'g' | 'l' | 'ml';
const unitFactors: Record<Unit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
};
export default {
  toBaseUnit(value: number, unit: Unit): number {
    const factor = unitFactors[unit];
    return value * factor;
  },
};
