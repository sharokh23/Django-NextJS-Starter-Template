import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ApiDemo from "./api-demo";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiDemo", () => {
  it("renders the demo cards", () => {
    render(<ApiDemo />);
    expect(screen.getByText("Next.js API Route")).toBeInTheDocument();
    expect(screen.getByText("Django Backend Route")).toBeInTheDocument();
    expect(screen.getByText("Interactive API Docs")).toBeInTheDocument();
  });

  it("shows the JSON response after a successful call", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ service: "frontend" }), {
          status: 200,
        }),
      ),
    );
    const user = userEvent.setup();
    render(<ApiDemo />);
    await user.click(screen.getByRole("button", { name: /api\/hello/i }));
    expect(
      await screen.findByText(/"service": "frontend"/),
    ).toBeInTheDocument();
  });

  it("shows an error message when the call fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 500 })),
    );
    const user = userEvent.setup();
    render(<ApiDemo />);
    await user.click(screen.getByRole("button", { name: /api\/hello/i }));
    expect(
      await screen.findByText(/failed with status 500/),
    ).toBeInTheDocument();
  });
});
