import {
    createContext,
    useContext,
    useMemo,
    useSyncExternalStore,
} from "react";
import ChessDocument from "../documents/ChessDocument";

const ChessContext = createContext(null);

export function ChessProvider({ children }) {
    const document = useMemo(() => new ChessDocument(), []);

    // Subscribe React to document changes
    useSyncExternalStore(
        (callback) => document.subscribe(callback),
        () => 0,
    );

    return (
        <ChessContext.Provider value={document}>
            {children}
        </ChessContext.Provider>
    );
}

export function useChess() {
    return useContext(ChessContext);
}
