import { createContext, useContext, useState } from "react";
import ChessDocument from "../documents/ChessDocument";

const ChessContext = createContext();

export function ChessProvider({ children }) {
    const [document] = useState(() => new ChessDocument());

    return (
        <ChessContext.Provider value={document}>
            {children}
        </ChessContext.Provider>
    );
}

export function useChess() {
    return useContext(ChessContext);
}
