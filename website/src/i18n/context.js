import { createContext } from "react";

// Kept in its own file with no other imports: editing the copy (en.js / ar.js)
// during development then hot-reloads the provider without creating a second
// context object, which would make open components lose their language.
export const LanguageContext = createContext(null);
