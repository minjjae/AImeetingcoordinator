const JOIN_CODE_PATTERN = /^[A-Z]{5}[0-9]{5}$/;
const JOIN_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const JOIN_CODE_DIGITS = "0123456789";

export function normalizeJoinCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
}

export function isValidJoinCode(value: string): boolean {
  return JOIN_CODE_PATTERN.test(normalizeJoinCode(value));
}

export function generateJoinCode(randomInt: (maxExclusive: number) => number): string {
  let code = "";

  for (let index = 0; index < 5; index += 1) {
    code += JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)];
  }

  for (let index = 0; index < 5; index += 1) {
    code += JOIN_CODE_DIGITS[randomInt(JOIN_CODE_DIGITS.length)];
  }

  return code;
}
