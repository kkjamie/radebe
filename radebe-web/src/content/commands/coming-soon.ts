import type { ExampleDoc } from "../../types.js";

export function createComingSoonDoc(definition: {
  id: string;
  title: string;
  navGroup: string;
  summary: string;
  args: string[];
  childCommands: string[];
  notes?: string[];
}): ExampleDoc {
  return {
    ...definition,
    comingSoon: true,
    notes: [
      "Coming soon.",
      ...(definition.notes ?? [])
    ]
  };
}
