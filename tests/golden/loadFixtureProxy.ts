// Small proxy so app routes can load golden fixtures without importing test helpers directly.
// This is dev-only and guarded by NODE_ENV checks in callers.

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - this file is consumed only in Node context
import { load_golden_fixture as pyLoadGolden } from "./load_golden_fixture_py";

export function load_golden_fixture(name: string): Record<string, unknown> {
  return pyLoadGolden(name) as Record<string, unknown>;
}

