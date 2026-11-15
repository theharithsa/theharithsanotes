# GitHub Project

[The Harithsa Notes](https://github.com/users/theharithsa/projects/2) is the public project for this repository. File work in [GitHub Issues](https://github.com/theharithsa/theharithsanotes/issues). Use the issue forms to classify bugs, features and tasks.

- [Milestones](https://github.com/users/theharithsa/projects/2/views/1) shows work grouped by outcome, including completed work.
- [Sprint planning](https://github.com/users/theharithsa/projects/2/views/2) shows open work and its sprint. Review unfinished work at the end of each two-week sprint.
- [Kanban](https://github.com/users/theharithsa/projects/2/views/3) shows execution status.
- [Roadmap](https://github.com/users/theharithsa/projects/2/views/4) uses the Sprint start and end dates.

Assign a planned issue and its implementation PR the same milestone. The intake workflows fill missing issue types and milestones, preserve explicit assignments, and send unplanned Dependabot work to Dependency maintenance. Project status alone does not close issues.

The intake workflows are based on [app-launchpad-template](https://github.com/theharithsa/app-launchpad-template/tree/31e91a6b5ea45cb59474e378842fe535fe0d92f7).

## Delivery and promotion

Open an issue-linked PR to protected `main`. The required Foundation and Website checks run on the PR, with zero required independent approvals. The Foundation check validates the documentation decision. The Website check builds the site and runs its application tests. Use a Firebase preview when the change needs isolated acceptance testing. After an authorized merge, use the [Firebase release procedure](firebase-only-migration.md) for runtime changes and verify the production revision.
