// The directory this module was loaded from, as an absolute URL ending in "/".
//
// Mirrors GWT.getModuleBaseURL() from the old Java app: it's derived from the
// actual script URL at runtime, not a hardcoded path, so resources fetched
// relative to it (setuplist.txt, examples/) are found correctly no matter
// what directory this build ends up deployed to or renamed to (e.g. a
// per-version directory like ripple5/).
//
// Deliberately avoids `new URL('.', import.meta.url)` here: Vite specially
// recognizes the syntactic pattern `new URL('literal', import.meta.url)` as
// an asset reference to bundle, and mishandles it in dev mode when the
// literal isn't a real file. Plain string slicing sidesteps that.
const url = import.meta.url;
export const moduleBaseURL = url.substring(0, url.lastIndexOf('/') + 1);
