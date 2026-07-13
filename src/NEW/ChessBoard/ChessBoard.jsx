import { useEffect, useRef, useState } from "react";
import "./ChessBoard.css";
import Frame from "./Layers/Frame/Frame";
import SquareLayer from "./Layers/SquareLayer/SquareLayer";
import LastMoveLayer from "./Layers/LastMoveLayer/LastMoveLayer";
import HighlightLayer from "./Layers/HighlightLayer/HighlightLayer";
import PieceLayer from "./Layers/PieceLayer/PieceLayer";
import InputLayer from "./Layers/InputLayer/InputLayer";
import DragGhostLayer from "./Layers/DragGhostLayer/DragGhostLayer";
function Board({ doc, updateCallback, isFlipped }) {
    // Passed in data //

    // Variables //
    const [drag, setDrag] = useState(false);
    const boardRef = useRef(null); // Board squares never change

    // Drag Handling
    useEffect(() => {
        if (!drag) return;

        const handlePointerMove = (e) => {
            setDrag((d) => {
                if (!d) return d;
                const dx = e.clientX - d.startX;
                const dy = e.clientY - d.startY;
                const moved = d.moved || Math.hypot(dx, dy) > 4;
                return { ...d, x: e.clientX, y: e.clientY, moved };
            });
        };
        const handlePointerUp = (e) => {
            const { rect } = drag;
            let x = Math.floor((e.clientX - rect.left) / (rect.width / 8));
            let y = Math.floor((e.clientY - rect.top) / (rect.height / 8));
            x = Math.max(0, Math.min(7, x));
            y = Math.max(0, Math.min(7, y));
            if (isFlipped) {
                x = 7 - x;
                y = 7 - y;
            }
            const targetSquare = "abcdefgh"[x] + (8 - y);

            if (drag.isDraggablePiece && drag.moved) {
                doc.movePiece(drag.square, targetSquare);
            } else if (!drag.isDraggablePiece) {
                doc.handleSquareClick(targetSquare);
            }
            updateCallback();
            setDrag(null);
        };
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [drag, isFlipped, doc]);

    // RENDER //
    return (
        <Frame isFlipped={isFlipped} ref={boardRef}>
            <SquareLayer isFlipped={isFlipped} />
            <LastMoveLayer doc={doc} flipped={isFlipped} />
            <HighlightLayer doc={doc} flipped={isFlipped} />
            <PieceLayer doc={doc} flipped={isFlipped} drag={drag} />
            <InputLayer
                doc={doc}
                flipped={isFlipped}
                boardRef={boardRef}
                setDrag={setDrag}
            />
            <DragGhostLayer drag={drag} />
        </Frame>
    );
}

// Hold Functionality Exclusive to a training board.
export function TrainingBoard({ doc }) {
    return (
        <div className="training-board-wrapper">
            <Board doc={doc} />
        </div>
    );
}

// Hold Functionality Exclusive to an analysis board.
export function AnalysisChessBoard({ doc, updateCallback, onFlip = null }) {
    const [flipped, setFlipped] = useState(false);
    // KEYBINDS //
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Get Keys
            const key = event.key;
            const isMod = event.ctrlKey || event.metaKey;

            // Undo Move //
            if (key.toLowerCase() === "z" && isMod) {
                event.preventDefault();
                doc.undo();
                updateCallback();
                return;
            }
            // Flip Board //
            if (key.toLowerCase() === "f") {
                setFlipped((f) => !f);
                if (onFlip) {
                    onFlip();
                }
                updateCallback();
                return;
            }
            switch (key) {
                // Go back a move //
                case "ArrowLeft":
                    doc.previousMove();
                    updateCallback();
                    break;
                // Go forward a move //
                case "ArrowRight":
                    doc.nextMove();
                    updateCallback();
                    break;
                // Cycle Variations //
                case "ArrowUp":
                    event.preventDefault();
                    doc.cycleVariation(-1);
                    updateCallback();
                    break;
                // Cycle Variations //
                case "ArrowDown":
                    event.preventDefault();
                    doc.cycleVariation(1);
                    updateCallback();
                    break;
                // Go to Move One //
                case "Home":
                    doc.goToStart();
                    updateCallback();
                    break;
                // Go to last Move //
                case "End":
                    doc.goToEnd();
                    updateCallback();
                    break;
                default:
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [doc]);

    // RENDER //
    return (
        <div className="analysis-board-wrapper">
            <Board
                doc={doc}
                isFlipped={flipped}
                updateCallback={updateCallback}
            />
        </div>
    );
}
