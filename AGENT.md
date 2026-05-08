# OpenSpec Workspace Rules

This repository uses OpenSpec + OpenCode workflow.

The AI agent must understand and follow the OpenSpec architecture.

---

# Folder Responsibilities

## .opencode/commands

Contains custom AI command behaviors.

Files:
- opsx-propose.md = proposal generation workflow
- opsx-apply.md = implementation workflow
- opsx-explore.md = repository analysis workflow
- opsx-archive.md = archival workflow

The AI must follow these command instructions when executing tasks.

---

## .opencode/skills

Contains reusable AI engineering skills.

The AI should:
- reuse skills before generating new logic
- follow skill-specific standards
- compose multiple skills when needed

---

## openspec/specs

Contains formal specifications.

Each spec defines:
- requirements
- implementation details
- constraints
- architecture decisions
- acceptance criteria

The AI must:
- read specs before coding
- validate implementation against specs
- avoid deviating from specifications

---

## openspec/changes

Contains active feature changes and implementation plans.

The AI should:
- track active modifications
- preserve compatibility
- understand pending migrations/refactors

---

## openspec/archive

Contains completed or deprecated specs/changes.

Use as historical reference only.

Do not restore archived behavior unless requested.

---

## openspec/config.yaml

Main OpenSpec configuration file.

The AI must respect:
- project schema
- configured workflows
- enabled tools
- repository conventions
