import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select, type SelectOption } from "./select";

const options: SelectOption[] = [
  { value: "one-time", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

describe("<Select />", () => {
  test("renders a labelled trigger showing the current value's label", () => {
    render(<Select value="monthly" onValueChange={vi.fn()} options={options} ariaLabel="Repeat" />);

    const trigger = screen.getByRole("button", { name: "Repeat" });
    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveTextContent("Monthly");
  });

  test("opening the trigger lists every option in a listbox", async () => {
    const user = userEvent.setup();
    render(<Select value="one-time" onValueChange={vi.fn()} options={options} ariaLabel="Repeat" />);

    await user.click(screen.getByRole("button", { name: "Repeat" }));

    expect(screen.getByRole("listbox", { name: "Repeat" })).toBeInTheDocument();
    for (const option of options) {
      expect(screen.getByRole("option", { name: option.label })).toBeInTheDocument();
    }
  });

  test("the option matching the value is marked selected", async () => {
    const user = userEvent.setup();
    render(<Select value="monthly" onValueChange={vi.fn()} options={options} ariaLabel="Repeat" />);

    await user.click(screen.getByRole("button", { name: "Repeat" }));

    expect(screen.getByRole("option", { name: "Monthly", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Yearly", selected: false })).toBeInTheDocument();
  });

  test("clicking an option calls onValueChange with that option's value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select value="one-time" onValueChange={onValueChange} options={options} ariaLabel="Repeat" />);

    await user.click(screen.getByRole("button", { name: "Repeat" }));
    await user.click(screen.getByRole("option", { name: "Yearly" }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("yearly");
  });

  test("keyboard navigation selects an option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select value="one-time" onValueChange={onValueChange} options={options} ariaLabel="Repeat" />);

    await user.click(screen.getByRole("button", { name: "Repeat" }));
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("monthly");
  });

  test("Escape closes the listbox", async () => {
    const user = userEvent.setup();
    render(<Select value="one-time" onValueChange={vi.fn()} options={options} ariaLabel="Repeat" />);

    await user.click(screen.getByRole("button", { name: "Repeat" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  test("a disabled select cannot be opened", async () => {
    const user = userEvent.setup();
    render(<Select value="one-time" onValueChange={vi.fn()} options={options} ariaLabel="Repeat" disabled />);

    const trigger = screen.getByRole("button", { name: "Repeat" });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  test("shows the placeholder when no value is selected", () => {
    render(<Select value="" onValueChange={vi.fn()} options={options} ariaLabel="Repeat" placeholder="Pick one" />);

    expect(screen.getByRole("button", { name: "Repeat" })).toHaveTextContent("Pick one");
  });
});
