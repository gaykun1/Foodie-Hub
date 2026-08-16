type ClassValue = string | number | bigint | null | undefined | false | ClassValue[];

const flatten = (value: ClassValue, out: string[]): void => {
  if (!value) return;
  if (Array.isArray(value)) {
    value.forEach((v) => flatten(v, out));
    return;
  }
  out.push(String(value));
};

// Minimal classnames joiner — avoids pulling in clsx/tailwind-merge as new deps.
export const cn = (...values: ClassValue[]): string => {
  const out: string[] = [];
  flatten(values, out);
  return out.join(" ");
};
