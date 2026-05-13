import { describe, expect, it } from "vitest";
import { localExtract, normalizeExtraction, stableId } from "@/lib/local-extractor";

describe("localExtract", () => {
  it("extracts entities, risks, and relationships from startup notes", () => {
    const result = localExtract("Acme Bank blocked the pilot because SOC2 is not complete.\nFollow up with Acme security next Tuesday.");

    expect(result.entities.some((entity) => entity.name === "SOC2 incomplete" && entity.type === "Risk")).toBe(true);
    expect(result.entities.some((entity) => entity.type === "FollowUp")).toBe(true);
    expect(result.relationships.some((relationship) => relationship.type === "BLOCKED_BY")).toBe(true);
  });

  it("creates stable deterministic ids", () => {
    expect(stableId("Risk", "SOC2 incomplete")).toBe(stableId("Risk", "SOC2 incomplete"));
  });
});

describe("normalizeExtraction", () => {
  it("sanitizes unknown types without dropping usable content", () => {
    const result = normalizeExtraction({
      title: "Import",
      entities: [{ type: "Unknown", name: "Enterprise trust", summary: "Trust gap", confidence: 2 }],
      relationships: [{ sourceName: "A", sourceType: "Nope", targetName: "B", targetType: "Risk", type: "weird", evidence: "x", confidence: -1 }],
    });

    expect(result.entities[0].type).toBe("Theme");
    expect(result.entities[0].confidence).toBe(1);
    expect(result.relationships[0].type).toBe("RELATED_TO");
  });
});
