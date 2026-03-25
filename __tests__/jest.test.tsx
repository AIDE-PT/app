import { describe, expect, test } from "@jest/globals";

describe("Jest Setup", () => {
  test("should run a simple test", () => {
    expect(true).toBe(true);
  });

  test("should perform basic arithmetic", () => {
    expect(2 + 2).toBe(4);
  });

  test("should verify string equality", () => {
    expect("hello").toBe("hello");
  });
});
