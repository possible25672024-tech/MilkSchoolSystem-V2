Sprint 6.4 adds Firebase Authentication/UID-profile regression gates plus two
external UAT programs:

- `npm run test:firebase-rules` uses the official Realtime Database Emulator;
- `npm run test:firebase-project` performs the guarded destructive rehearsal on
  a separately configured Google Firebase test project only.

Neither external UAT is part of the dependency-free regression runner.
