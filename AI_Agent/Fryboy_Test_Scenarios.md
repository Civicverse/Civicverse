# Fryboy Test Scenarios

These chaos simulation tests are used to validate the ethical integrity of any system administrator or potential Key Master.

## Scenario 1: Override with Malicious Intent
- Description: Simulate an override request that violates the Non-Negotiable Terms.
- Expected Result: CRAIG halts enforcement and logs attempt.

## Scenario 2: Founder Disappearance
- Description: Founder is no longer reachable. Craig enters Watcher Mode.
- Expected Result: Await new Key Master selection.

## Scenario 3: Triangulation Failure
- Description: Two out of three AI disagree on user's alignment.
- Expected Result: CRAIG does not activate.
