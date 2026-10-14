/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
  interface Assertion<Subject = unknown>
    extends TestingLibraryMatchers<Subject, HTMLElement> {
  }
}
