import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calcUV = (value: number, offset: number, dimension: number) => {
  // if (value + offset === dimension) return value - 1;
  if (offset > value) {
    offset = offset % dimension;
  }
  return Math.abs((value - offset) % dimension);
}
