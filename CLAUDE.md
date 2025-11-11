# CLAUDE.md

### Do

- use React Native
- use React Native Elements for ui components
- default to small components
- default to small diffs
- multilanguage (should support different laguages)
- date format should be based on user locale

### Don't

- do not hard code colors
- do not create ad-hoc components if we have a component already that does the same
- do not add new heavy dependencies without approval

### Tech Stack

Prefer tech stack:

- React Native
- React Native Elements
- Typescript
- Eslint
- Prettier (format on save)
- Jest
- Playwright
- PNPM as package manager

### Process for writing code

# Split the task into smaller steps

Once given a task, split it into smaller steps (and components).

Keep splitting into smaller tasks until we comply with best practices: SOLID, DRY, YANGNI, KISS...

# Create tests first

Once you have the smallest possible tasks that make sense, create a test for each component/file/logic entity before writting code for it.

When writting tests keep in mind:

- what we want to achieve
- what are the critical parts to test
- possible edge cases
- the test should help define the behavior of what we are building, it should act as the requirements definition

# Create the code following best practices

The purpose of the following best practices is to achieve a codebase that is: resilient, easy to maintain, scalable and flexible. These principles should serve that purpose.

The code should comply with best practices:

- SOLID: single responsibility (the most important one, each part should only be responsible of a single thing), Open/Closed, Liskov Substitution, Interface segregation, Dependency Inversion.
- DRY: don't repeat yourself, the code should be reusable and make use of existing components, functions and pieces
- KISS: keep it supidly simple. The functions, components and overall code should be as simple as possible, as isolated as possible and as testable as possible.
- YANGNI: you are not gonna need it. Don't over architecture, don't create abstractions where they are not needed, it's easier to maintain something simpler that can be better understood as long as it doesn't violate previous principles.
- Pure functions are prefered (as they align better with the previous principles).
- Small functions are prefered (for the same reason).
- Everything should be typed (will greatly help achieve the codebase objectives).
- Always prefer composition over inheritance.
- Use PascalCase for functions and components, and snake_case for file names.

# Execute test to validate implementation

Execute tests to validate each implementation after the code has been created.

If the tests fail, iterate until they pass.

### Safety and permissions

Allowed without prompt:

- read files, list files
- tsc single file, prettier, eslint
- run test

Ask first:

- package installs
- git commit
- git push
- deleting files, chmod
- running full build or end to end suites

### Project structure

You can choose the project structure based on best practices, but keep logic, components, routes and styles in separated files.

Keep shared code on common folders.

Keep language translation separated in different files for each locale so they are easier to translate.

### Docs

- docs in ./docs/\*.md

### PR checklist

- format and type check: green (run prettier if needed)
- unit tests: green. add tests for new code paths
- diff: small with a brief summary

### When stuck

- ask a clarifying question, propose a short plan, or open a draft PR with notes

### Test first mode

- write or update tests first on new features, then code to green

### Design system

- Look and feel should be clean and overall consistent across the entire app.
- All language variables should be in separate files with names based on the locale so they are easier to translate and review.
