// @ts-ignore -- Tests use the project's Bun convention.
import { expect, test } from "bun:test";
import { validateNewPassword } from "./emailAuth";

test("new passwords require at least 8 characters", () => {
  expect(validateNewPassword("1234567")).not.toBeNull();
  expect(validateNewPassword("12345678")).toBeNull();
});