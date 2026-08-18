// Escapes regex metacharacters so user-supplied search text is matched
// literally. Without this, a search endpoint that interpolates raw input into
// a MongoDB $regex is both a regex-injection vector (e.g. ".*" matches
// everything) and an unauthenticated ReDoS vector (a crafted pattern like
// "(a+)+$" can make the regex engine hang, freezing that query indefinitely).
export const escapeRegExp = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
