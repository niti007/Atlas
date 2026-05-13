import { describe, expect, it } from "vitest";
import { getSkill, getSkills } from "@/lib/skills";

describe("Atlas Tessl skills", () => {
  it("loads the expected skill set", () => {
    const skills = getSkills();

    expect(skills.map((skill) => skill.id)).toEqual(["founder-memory", "investor-brief", "risk-radar", "product-roadmap"]);
    expect(skills.every((skill) => skill.rawMarkdown.includes("#"))).toBe(true);
  });

  it("falls back to founder memory for unknown skill ids", () => {
    expect(getSkill("missing").id).toBe("founder-memory");
  });
});
