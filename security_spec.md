# Security Specification for TrustDesk

## 1. Data Invariants
- Each record (Risk, Audit, Event, Evidence, Inventory) MUST belong to a specific authenticated user.
- A user can only read or write their own data.
- System generated fields like `hash` and `signature` in Evidence must be present on creation.
- `role` or `privilege` elevation is not permitted.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create a Risk document with a different `ownerId` than the authenticated user.
2. **PII Leakage**: Attempt to read a user's evidence vault artifacts as another authenticated user.
3. **Shadow Field Injection**: Attempt to create a Risk with an undocumented field `isVerified: true`.
4. **State Skip**: Attempt to update a Risk directly from 'Identified' to 'Remediated' without providing residual scores (simulated).
5. **Denial of Wallet**: Attempt to use a 1MB string as a Document ID or inside a title field.
6. **Orphaned Writes**: Attempt to list all risks without a `where('ownerId', '==', uid)` clause.
7. **Type Poisoning**: Attempt to write a number into the `title` field.
8. **Immutability Breach**: Attempt to change the `ownerId` of an existing Risk.
9. **Timestamp Spoofing**: Use a client-side timestamp for `createdAt` instead of server-verified time (logic check).
10. **Array Explosion**: Attempt to add 10,000 strings to the `findings` array.
11. **Metadata Overload**: Attempt to push 1MB of JSON into the `metadata` field.
12. **Anonymous Access**: Attempt to read the inventory without being signed in.

## 3. Test Runner (Draft)
```ts
// firestore.rules.test.ts
// Verifies that all "Dirty Dozen" payloads return PERMISSION_DENIED.
// Implementation follows standard firebase-rules-unit-testing patterns.
```
