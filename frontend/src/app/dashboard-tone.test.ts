import { describe, expect, test } from "vitest";
import { toneOfDelta } from "./dashboard-tone";
import { formatDelta } from "./core";

describe("toneOfDelta", () => {
  test("maps every class name formatDelta can emit", () => {
    expect(toneOfDelta("positive")).toBe("positive");
    expect(toneOfDelta("negative")).toBe("negative");
    expect(toneOfDelta("neutral")).toBe("flat");
  });

  test("agrees with formatDelta end to end, including the inverted metrics", () => {
    // A rising number is good for mood and bad for pain; the tone has to
    // follow the meaning, not the sign.
    expect(toneOfDelta(formatDelta(8)!.className)).toBe("positive");
    expect(toneOfDelta(formatDelta(-3)!.className)).toBe("negative");
    expect(toneOfDelta(formatDelta(8, true)!.className)).toBe("negative");
    expect(toneOfDelta(formatDelta(-3, true)!.className)).toBe("positive");
    expect(toneOfDelta(formatDelta(0)!.className)).toBe("flat");
  });
});
