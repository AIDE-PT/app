import { describe, expect, test } from "@jest/globals";

// Testa que LOCAL_API_BASE é uma string válida
// (o valor real depende da plataforma e da env var EXPO_PUBLIC_LOCAL_API_URL)
jest.mock("react-native", () => ({
  Platform: { select: (map: Record<string, string>) => map.default },
}));

import { LOCAL_API_BASE } from "@/constants/api";

describe("LOCAL_API_BASE", () => {
  test("is a non-empty string", () => {
    expect(typeof LOCAL_API_BASE).toBe("string");
    expect(LOCAL_API_BASE!.length).toBeGreaterThan(0);
  });

  test("contains a port number", () => {
    expect(LOCAL_API_BASE).toMatch(/:\d+/);
  });

  test("starts with http", () => {
    expect(LOCAL_API_BASE).toMatch(/^https?:\/\//);
  });
});
