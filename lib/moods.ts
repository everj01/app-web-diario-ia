export const MOODS = [
  { value: 1, label: "Muy mal", color: "#7C8DB5" },
  { value: 2, label: "Mal", color: "#A99CC0" },
  { value: 3, label: "Normal", color: "#D6CCB4" },
  { value: 4, label: "Bien", color: "#9FC08F" },
  { value: 5, label: "Muy bien", color: "#F2C94C" },
] as const;

export function findMood(value: number | null | undefined) {
  return MOODS.find(
    (m) => m.value === value
  ) ?? null;
}

export function isValidMood(value: unknown): value is number | null {
  return (
    value === null ||
    (
      typeof value === "number" && 
      Number.isInteger(value) && 
      value >= 1 && 
      value <= 5
    )
  );
}
