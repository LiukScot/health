import { beforeAll, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select, type SelectOption } from "./select";

// Radix Select relies on a few DOM APIs jsdom does not implement.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const options: SelectOption[] = [
  { value: "one-time", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

describe("<Select />", () => {
  test("renders a labelled trigger showing the current value's label", () => {
    render(<Select value="monthly" onValueChange={vi.fn()} options={options} ariaLabel="Repeat" />);

    const trigger = screen.getByRole("combobox", { name: "Repeat" });
    expect(trigger).toHaveTextContent("Monthly");
  });

  test("opening the trigger lists every option", async () => {
    const user = userEvent.setup();
    render(<Select value="one-time" onValueChange={vi.fn()} options={options} ariaLabel="Repeat" />);

    await user.click(screen.getByRole("combobox", { name: "Repeat" }));

    for (const option of options) {
      expect(screen.getByRole("option", { name: option.label })).toBeInTheDocument();
    }
  });

  test("choosing an option calls onValueChange with that option's value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select value="one-time" onValueChange={onValueChange} options={options} ariaLabel="Repeat" />);

    await user.click(screen.getByRole("combobox", { name: "Repeat" }));
    await user.click(screen.getByRole("option", { name: "Yearly" }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("yearly");
  });

  test("a disabled select cannot be opened", async () => {
    const user = userEvent.setup();
    render(<Select value="one-time" onValueChange={vi.fn()} options={options} ariaLabel="Repeat" disabled />);

    const trigger = screen.getByRole("combobox", { name: "Repeat" });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  test("shows the placeholder when no value is selected", () => {
    render(<Select value="" onValueChange={vi.fn()} options={options} ariaLabel="Repeat" placeholder="Pick one" />);

    expect(screen.getByRole("combobox", { name: "Repeat" })).toHaveTextContent("Pick one");
  });
});
