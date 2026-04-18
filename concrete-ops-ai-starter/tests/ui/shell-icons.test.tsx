// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

const pathnameMock = vi.fn(() => "/dashboard");

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

vi.mock("@/components/auth/SignOutButton", () => ({
  SignOutButton: ({ className }: { className?: string }) => <button className={className}>Sign Out</button>,
}));

import { AppShell } from "@/components/layout/AppShell";
import { EmployeeShell } from "@/components/layout/EmployeeShell";

function expectMenuIconsToStaySized(container: HTMLElement) {
  const icons = Array.from(container.querySelectorAll('[data-slot="sidebar-menu-button"] svg'));

  expect(icons.length).toBeGreaterThan(0);

  for (const icon of icons) {
    const width = icon.getAttribute("width");
    const height = icon.getAttribute("height");

    expect(width).not.toBeNull();
    expect(height).not.toBeNull();
    expect(Number(width)).toBeGreaterThan(0);
    expect(Number(height)).toBeGreaterThan(0);
  }
}

describe("shell nav icons", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/dashboard");

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1280,
    });

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("keeps admin nav icons at a fixed size", () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );

    expectMenuIconsToStaySized(container);
  });

  it("keeps employee nav icons at a fixed size", () => {
    pathnameMock.mockReturnValue("/employee");

    const { container } = render(
      <EmployeeShell>
        <div>Content</div>
      </EmployeeShell>,
    );

    expectMenuIconsToStaySized(container);
  });
});
