// @ts-ignore bun test runner types
import { describe, it, expect } from "bun:test";
import { canUseFreeTrial, FREE_TRIALS } from "./trialLimit";

describe("free trial limit", () => {
  it("allows exactly 2 free tries", () => {
    expect(FREE_TRIALS).toBe(2);
    expect(canUseFreeTrial(0)).toBe(true);
    expect(canUseFreeTrial(1)).toBe(true);
  });
  it("blocks the 3rd try", () => {
    expect(canUseFreeTrial(2)).toBe(false);
  });
});
