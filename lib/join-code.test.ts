import { describe, expect, it } from "vitest";
import { generateJoinCode, isValidJoinCode, normalizeJoinCode } from "./join-code";

describe("group join codes", () => {
  it("normalizes pasted codes", () => {
    expect(normalizeJoinCode(" fea-ty 20268 ")).toBe("FEATY20268");
  });

  it("accepts exactly five letters followed by five digits", () => {
    expect(isValidJoinCode("FEATY20268")).toBe(true);
    expect(isValidJoinCode("FEAT202688")).toBe(false);
    expect(isValidJoinCode("FEATYABCDE")).toBe(false);
  });

  it("generates the expected stable shape", () => {
    const values = [5, 4, 0, 19, 24, 2, 0, 2, 6, 8];
    let cursor = 0;
    const code = generateJoinCode(() => values[cursor++]);

    expect(code).toBe("FEATY20268");
    expect(isValidJoinCode(code)).toBe(true);
  });
});
