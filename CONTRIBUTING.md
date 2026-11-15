# Contributing

Use the [GitHub issue forms](https://github.com/theharithsa/theharithsanotes/issues/new/choose) to report bugs or propose improvements. See the [project views and sprint process](docs/github-project.md) for scheduling.

Use Node.js 24 and run `npm ci`. Start with `npm run dev`. Follow the [test commands](docs/testing.md) and use the isolated Firebase emulator for CMS tests. Use fictional data when testing publishing or access controls.

For public documentation, update the guide source in `docs/public-guides.json` or the product page in `site/`. Run `python scripts/build_public_docs.py --output dist/public-docs` with an empty output directory, then serve it locally with `python -m http.server 8000 --directory dist/public-docs`. Review the affected pages at desktop and phone widths. Keep real private content, test records, and video rendering sources outside the artifact.

Open a pull request linked to its issue. Include the expected behavior, scope, relevant checks, and any deployment or telemetry impact. Report security concerns through the [private reporting channel](SECURITY.md).

Use the PR template’s **Documentation impact** section to link affected guides or explain why they still apply. The Foundation check verifies that a decision is present. Review the decision against the actual change before merging.
