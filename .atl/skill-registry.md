# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | /home/leandrojaviercepeda/.config/opencode/skills/branch-pr/SKILL.md |
| When writing Go tests, using teatest, or adding test coverage | go-testing | /home/leandrojaviercepeda/.config/opencode/skills/go-testing/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | /home/leandrojaviercepeda/.config/opencode/skills/issue-creation/SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | judgment-day | /home/leandrojaviercepeda/.config/opencode/skills/judgment-day/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | /home/leandrojaviercepeda/.config/opencode/skills/skill-creator/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue — no exceptions
- Every PR MUST have exactly one `type:*` label
- Automated checks must pass before merge is possible
- Blank PRs without issue linkage will be blocked by GitHub Actions
- Branch names MUST match: `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`
- Use conventional commits: `type(scope): description`

### go-testing
- Use table-driven tests for multiple test cases
- Test Bubbletea TUI with teatest library
- Use golden files for expected output comparisons
- Follow Go testing conventions: `*testing.T` parameter
- Run `go test -v` for verbose output
- Use `t.Run()` to structure sub-tests

### issue-creation
- Blank issues are disabled — MUST use a template (bug report or feature request)
- Every issue gets `status:needs-review` automatically on creation
- A maintainer MUST add `status:approved` before any PR can be opened
- Questions go to Discussions, not issues
- Search existing issues for duplicates before creating

### judgment-day
- Launch TWO sub-agents via delegate (async, parallel — never sequential)
- Each agent receives the same target but works independently
- Neither agent knows about the other — no cross-contamination
- Use Skill Resolver Protocol before launching judges
- Inject matching compact rules into BOTH Judge prompts

### skill-creator
- Create a skill when patterns are used repeatedly and AI needs guidance
- Follow skill structure: `skills/{skill-name}/SKILL.md`
- Include frontmatter with name, description, trigger, license
- Document critical patterns with code examples
- Keep SKILL.md concise — use references/ for detailed docs

## Project Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When architecting NestJS apps, implementing error handling, writing tests, adding caching, auth, or observability | nestjs-backend-best-practices | .opencode/nestjs-backend-best-practices/SKILL.md |

## Project Conventions

No project conventions found. This is a greenfield project.

| File | Path | Notes |
|------|------|-------|
| None | — | No convention files in project |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
