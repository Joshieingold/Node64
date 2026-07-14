import { useEffect, useRef, useState } from "react";
import "./ChessBoard.css";
import Frame from "./Layers/Frame/Frame";
import SquareLayer from "./Layers/SquareLayer/SquareLayer";
import LastMoveLayer from "./Layers/LastMoveLayer/LastMoveLayer";
import HighlightLayer from "./Layers/HighlightLayer/HighlightLayer";
import PieceLayer from "./Layers/PieceLayer/PieceLayer";
import InputLayer from "./Layers/InputLayer/InputLayer";
import DragGhostLayer from "./Layers/DragGhostLayer/DragGhostLayer";
import ArrowLayer from "./Layers/ArrowLayer/ArrowLayer";

function squareFromPointer(e, rect, isFlipped) {
    let x = Math.floor((e.clientX - rect.left) / (rect.width / 8));
    let y = Math.floor((e.clientY - rect.top) / (rect.height / 8));
    x = Math.max(0, Math.min(7, x));
    y = Math.max(0, Math.min(7, y));
    if (isFlipped) {
        x = 7 - x;
        y = 7 - y;
    }
    return "abcdefgh"[x] + (8 - y);
}

// Modifier held while starting the right-click drag picks the arrow
// color — same convention as lichess/chess.com.
function colorFromModifiers(e) {
    if (e.shiftKey) return "R";
    if (e.altKey) return "B";
    if (e.ctrlKey || e.metaKey) return "Y";
    return "G";
}

function Board({ doc, updateCallback, isFlipped, inWidth }) {
    // Passed in data //

    // Variables //
    const [drag, setDrag] = useState(false);
    const [arrowDrag, setArrowDrag] = useState(null);
    const boardRef = useRef(null); // Board squares never change

    // Drag Handling (pieces, left-click)
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

    // Arrow annotation handling (right-click drag).
    // Attached imperatively to the board's DOM node rather than as
    // React props on <Frame>, since Frame's source isn't available
    // here to confirm it forwards extra props to its root element.
    useEffect(() => {
        const el = boardRef.current;
        if (!el) return;

        const handleContextMenu = (e) => e.preventDefault();

        const handlePointerDown = (e) => {
            if (e.button !== 2) return; // right mouse button only
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const fromSquare = squareFromPointer(e, rect, isFlipped);
            setArrowDrag({
                rect,
                fromSquare,
                startX: e.clientX,
                startY: e.clientY,
                x: e.clientX,
                y: e.clientY,
                color: colorFromModifiers(e),
            });
        };

        el.addEventListener("contextmenu", handleContextMenu);
        el.addEventListener("pointerdown", handlePointerDown);
        return () => {
            el.removeEventListener("contextmenu", handleContextMenu);
            el.removeEventListener("pointerdown", handlePointerDown);
        };
    }, [isFlipped]);

    useEffect(() => {
        if (!arrowDrag) return;

        const handleMove = (e) => {
            setArrowDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
        };
        const handleUp = (e) => {
            const { rect, fromSquare, color } = arrowDrag;
            const toSquare = squareFromPointer(e, rect, isFlipped);

            if (toSquare === fromSquare) {
                // Plain right-click, no drag: clear all arrows here.
                doc.chessData.clearArrows();
            } else {
                doc.chessData.toggleArrow(fromSquare, toSquare, color);
            }
            updateCallback();
            setArrowDrag(null);
        };

        window.addEventListener("pointermove", handleMove);
        window.addEventListener("pointerup", handleUp);
        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerup", handleUp);
        };
    }, [arrowDrag, isFlipped, doc, updateCallback]);

    // Live preview of the arrow being dragged, before release.
    let previewArrow = null;
    if (arrowDrag && boardRef.current) {
        const rect = arrowDrag.rect;
        const liveToSquare = squareFromPointer(
            { clientX: arrowDrag.x, clientY: arrowDrag.y },
            rect,
            isFlipped,
        );
        if (liveToSquare !== arrowDrag.fromSquare) {
            previewArrow = {
                from: arrowDrag.fromSquare,
                to: liveToSquare,
                color: arrowDrag.color,
            };
        }
    }

    // RENDER //
    return (
        <Frame isFlipped={isFlipped} ref={boardRef} width={inWidth}>
            <SquareLayer isFlipped={isFlipped} />
            <LastMoveLayer doc={doc} flipped={isFlipped} />
            <HighlightLayer doc={doc} flipped={isFlipped} />
            <PieceLayer doc={doc} flipped={isFlipped} drag={drag} />
            <ArrowLayer
                doc={doc}
                flipped={isFlipped}
                previewArrow={previewArrow}
            />
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
export function AnalysisChessBoard({
    doc,
    updateCallback,
    onFlip = null,
    inWidth,
}) {
    const [flipped, setFlipped] = useState(false);
    // KEYBINDS //

    useEffect(() => {
        const id = Math.random().toString(36).slice(2, 8);
        console.log("MOUNT keydown listener", id);
        const handleKeyDown = (event) => {
            console.log("fired", id);
            // ...
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            console.log("UNMOUNT keydown listener", id);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [doc, updateCallback, onFlip]);
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
        window.addEventListener("keydown", handleKeyDown, inWidth);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [doc]);

    // RENDER //
    return (
        <div className="analysis-board-wrapper">
            <Board
                doc={doc}
                isFlipped={flipped}
                updateCallback={updateCallback}
                inWidth={inWidth}
            />
        </div>
    );
}
