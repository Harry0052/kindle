/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExampleCard } from "./example-card";

afterEach(() => cleanup());

describe("example card", () => {
  it("labels the sample and does not offer a join or create action", () => {
    render(<ExampleCard />);
    expect(screen.getByText("Example")).toBeTruthy();
    expect(screen.getByText(/not saved/i)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
