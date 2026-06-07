import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateField } from "./DateField";

describe("<DateField />", () => {
  test("empty value renders placeholder on a labelled trigger button", () => {
    render(<DateField value="" onChange={vi.fn()} ariaLabel="Birth date" placeholder="Pick a day" />);

    const trigger = screen.getByRole("button", { name: "Birth date" });
    expect(trigger).toHaveTextContent("Pick a day");
    expect(trigger).toHaveAttribute("data-empty", "true");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("empty value falls back to the default placeholder when none is passed", () => {
    render(<DateField value="" onChange={vi.fn()} ariaLabel="Birth date" />);

    expect(screen.getByRole("button", { name: "Birth date" })).toHaveTextContent("Select date");
  });

  test("a value renders the formatted date and is not marked empty", () => {
    render(<DateField value="2024-03-15" onChange={vi.fn()} ariaLabel="Birth date" />);

    const trigger = screen.getByRole("button", { name: "Birth date" });
    expect(trigger).toHaveTextContent("15 Mar 2024");
    expect(trigger).not.toHaveAttribute("data-empty");
  });

  test("clicking the trigger opens the calendar popover dialog", async () => {
    const user = userEvent.setup();
    render(<DateField value="2024-03-15" onChange={vi.fn()} ariaLabel="Birth date" />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Birth date" }));

    const dialog = screen.getByRole("dialog", { name: "Birth date" });
    expect(dialog).toBeInTheDocument();
    // the day picker grid lives inside the popover
    expect(within(dialog).getByRole("grid")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Birth date" })).toHaveAttribute("aria-expanded", "true");
  });

  test("selecting a day calls onChange with the matching ISO string (no off-by-one)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateField value="2024-03-15" onChange={onChange} ariaLabel="Birth date" />);

    await user.click(screen.getByRole("button", { name: "Birth date" }));

    // March 2024 is the visible month (driven by the selected value).
    // Pick day 20: react-day-picker labels day cells with the full date.
    const dialog = screen.getByRole("dialog");
    const day20 = within(dialog).getByRole("button", { name: /March 20(th)?,? 2024/i });
    await user.click(day20);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("2024-03-20");
  });

  test("selecting a day closes the popover", async () => {
    const user = userEvent.setup();
    render(<DateField value="2024-03-15" onChange={vi.fn()} ariaLabel="Birth date" />);

    await user.click(screen.getByRole("button", { name: "Birth date" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /March 20(th)?,? 2024/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("pressing Escape closes the popover", async () => {
    const user = userEvent.setup();
    render(<DateField value="2024-03-15" onChange={vi.fn()} ariaLabel="Birth date" />);

    await user.click(screen.getByRole("button", { name: "Birth date" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("clicking outside the field closes the popover", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DateField value="2024-03-15" onChange={vi.fn()} ariaLabel="Birth date" />
        <button type="button">outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Birth date" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "outside" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
