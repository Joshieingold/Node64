import "./App.css";
import AppShell from "./layout/appShell";
import { ChessProvider } from "./context/ChessContext";

export default function App() {
    return (
        <ChessProvider>
            <AppShell />
        </ChessProvider>
    );
}
