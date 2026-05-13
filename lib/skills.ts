import fs from "fs";
import path from "path";
import type { AtlasSkill } from "@/lib/types";

const SKILL_DIR = path.join(process.cwd(), "tessl", "atlas-memory-skills", "skills");

const FALLBACK_SKILLS: Omit<AtlasSkill, "rawMarkdown" | "filePath">[] = [
  {
    id: "founder-memory",
    name: "Founder Memory",
    lens: "Operating memory",
    description: "Extracts durable company memory: decisions, causes, owners, objections, and follow-ups.",
    extractionFocus: ["Decisions", "Causal links", "Customer evidence", "Follow-ups"],
    queryStrategy: "Start from decisions and repeated themes, then traverse to customers, risks, and sources.",
    answerStyle: "Concise founder operating memo with evidence and next actions.",
    dashboardPriority: ["Decisions", "Risks", "FollowUps", "Themes"],
    systemPrompt: "You are Atlas in Founder Memory mode. Preserve company history, connect causes to decisions, and cite evidence.",
  },
  {
    id: "investor-brief",
    name: "Investor Brief",
    lens: "Investor-facing narrative",
    description: "Turns graph memory into investor-ready concerns, proof points, and concise updates.",
    extractionFocus: ["Investor concerns", "Market proof", "Objections", "Momentum"],
    queryStrategy: "Prioritize Investor, Customer, Risk, and Decision nodes; surface repeated concerns and supporting evidence.",
    answerStyle: "Board-update style: clear narrative, risks, proof, and mitigation.",
    dashboardPriority: ["Investor", "Customer", "Risk", "Decision"],
    systemPrompt: "You are Atlas in Investor Brief mode. Frame answers as investor-ready updates grounded in graph evidence.",
  },
  {
    id: "risk-radar",
    name: "Risk Radar",
    lens: "Blocker detection",
    description: "Finds repeated blockers, stalled work, unresolved objections, and risk clusters.",
    extractionFocus: ["Risks", "Objections", "Blocked deals", "Unresolved follow-ups"],
    queryStrategy: "Start from Risk and Objection nodes, then traverse BLOCKED_BY, CAUSED_BY, and RAISED_BY relationships.",
    answerStyle: "Risk register style with severity, evidence, and mitigation steps.",
    dashboardPriority: ["Risk", "Objection", "FollowUp", "Customer"],
    systemPrompt: "You are Atlas in Risk Radar mode. Detect blockers, name the pattern, and recommend mitigation.",
  },
  {
    id: "product-roadmap",
    name: "Product Roadmap",
    lens: "Product strategy",
    description: "Converts customer evidence into roadmap pressure, tradeoffs, and prioritization logic.",
    extractionFocus: ["Features", "Customer requests", "Roadmap decisions", "Prioritization reasons"],
    queryStrategy: "Start from Feature and Decision nodes, then traverse customer demand and risk relationships.",
    answerStyle: "Product memo with roadmap impact, customer evidence, and tradeoffs.",
    dashboardPriority: ["Feature", "Decision", "Customer", "Objection"],
    systemPrompt: "You are Atlas in Product Roadmap mode. Explain roadmap pressure using customer and decision evidence.",
  },
];

export function getSkills(): AtlasSkill[] {
  return FALLBACK_SKILLS.map((skill) => {
    const filePath = path.join(SKILL_DIR, skill.id, "SKILL.md");
    const rawMarkdown = readSkillFile(filePath);
    const frontmatter = parseFrontmatter(rawMarkdown);

    return {
      ...skill,
      name: frontmatter.name || skill.name,
      description: frontmatter.description || skill.description,
      filePath: path.relative(process.cwd(), filePath).replace(/\\/g, "/"),
      rawMarkdown,
    };
  });
}

export function getSkill(skillId?: string | null): AtlasSkill {
  const skills = getSkills();
  return skills.find((skill) => skill.id === skillId) || skills[0];
}

function readSkillFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function parseFrontmatter(markdown: string): Record<string, string> {
  if (!markdown.startsWith("---")) return {};
  const end = markdown.indexOf("\n---", 3);
  if (end === -1) return {};

  return markdown
    .slice(3, end)
    .split(/\r?\n/)
    .reduce<Record<string, string>>((acc, line) => {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) acc[key.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "");
      return acc;
    }, {});
}
