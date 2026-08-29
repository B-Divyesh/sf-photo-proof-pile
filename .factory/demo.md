# Demo sandbox

## Entry point

Open `https://photo-proof-pile.sociobot.in/demo` or `https://photo-proof-pile.sociobot.in/?demo=1`. Locally, run `npm run dev` and open `http://127.0.0.1:5173/demo`.

## Sample data

The demo starts with eight photo records across three evidence groups:

- three byte-identical lake copies on different sample drives;
- three birthday burst photos captured seconds apart;
- an original dog photo and a smaller message copy.

The sample contains realistic paths, sizes, dimensions, capture dates, cameras, file identifiers, and copies-on-other-drive counts. Its illustrations ship in `public/samples/`.

## Isolation and reset

Demo choices use the session-storage key `demo:photo-proof-pile:session`. They never read or write the real namespace `proof-pile:session`. Quarantine and restore run in memory during the demo. They do not invoke native file commands.

Use **Reset demo** in the persistent banner to discard changes. Use **Start for real** to leave the demo; demo data is discarded.

## Verification

Run `npm test`. Claim tests open `/demo` in fresh browser contexts, exercise the decision flow, inspect the CSV, intercept requests, and reload offline.
