import { createContext } from "react";

// Context objects live in their own file so hot-reloading AppState.jsx or
// Pipeline.jsx during development doesn't create a second context.
export const AppStateContext = createContext(null);
export const PipelineContext = createContext(null);
