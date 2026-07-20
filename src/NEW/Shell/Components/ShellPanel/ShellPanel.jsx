import { useState } from "react";
import "./ShellPanel.css";

export default function ShellPanel({ panelItems }) {
    const [selectedItem, setSelectedItem] = useState(null);

    const handleItemClick = (itemId) => {
        setSelectedItem((current) => (current === itemId ? null : itemId));
    };

    const selectedPanel = panelItems.find((item) => item.id === selectedItem);

    return (
        <div className="shell-panel">
            <div className="panel-switch-container">
                {panelItems.map((item) => (
                    <div
                        key={item.id}
                        className={`panel-switch ${
                            selectedItem === item.id ? "selected-switch" : ""
                        }`}
                        onClick={() => handleItemClick(item.id)}
                        title={item.toolTip}
                    >
                        <img
                            src={item.logo}
                            alt=""
                            className={`panel-logo ${
                                selectedItem === item.id ? "selected-logo" : ""
                            }`}
                            draggable={false}
                        />
                    </div>
                ))}
            </div>

            <div
                className={`shell-panel-content ${
                    selectedPanel ? "" : "hidden-width"
                }`}
            >
                {selectedPanel?.content}
            </div>
        </div>
    );
}
