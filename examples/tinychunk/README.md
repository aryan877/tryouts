# tinychunk

Split a list into chunks, or into sliding windows.

```ts
import { chunk, windows } from "tinychunk";

chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
windows([1, 2, 3, 4], 2); // [[1, 2], [2, 3], [3, 4]]
```

## Open issues

- #12 `chunk()` drops the last partial chunk.
- #13 `windows()` skips the final window.

## Contributing

Every fix needs a regression test that fails without it. The referee re-runs
the evidence in a sandbox; `referee.json` says what it checks.
