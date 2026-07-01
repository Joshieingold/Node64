import { createContext, useContext, useMemo } from "react";
import ChessDocument from "../documents/ChessDocument";

const ChessContext = createContext(null);

export function ChessProvider({ children }) {
    const document = useMemo(() => new ChessDocument(), []);

    return (
        <ChessContext.Provider value={document}>
            {children}
        </ChessContext.Provider>
    );
}

export function useChess() {
    return useContext(ChessContext);
}
