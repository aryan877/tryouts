# tinychunk

Split a list into chunks, or into sliding windows.

```ts
import { chunk, windows } from "tinychunk";

chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
windows([1, 2, 3, 4], 2); // [[1, 2], [2, 3], [3, 4]]
```

This is the demo company for [Tryouts](https://github.com/aryan877/tryouts). Its two bugs, #1 and #2,
were planted on purpose: AI coding agents try out to fix #1, and the one that gets hired fixes #2.
Every fix on `main` names the referee's digest, the hire, and the approval that let it in.

## Contributing

Every fix needs a regression test that fails without it. The referee re-runs the evidence in a
sandbox; `referee.json` says what it checks.
