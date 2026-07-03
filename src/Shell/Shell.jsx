import "./Shell.css";
import AnalysisPage from "../Pages/AnalysisPage";
import Compass from "/Compass.png";
import Explorer from "../Components/Explorer/Explorer";
import { useState } from "react";
import ChessDocument from "../DataClasses/ChessDocument";

export default function Shell() {
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    const CreateAnalysisTab = () => {
        const newTab = {
            id: crypto.randomUUID(),
            type: "analysis",
            title: "Analysis",
            pageData: new ChessDocument(),
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
    };
    const removeTab = (tabId) => {
        setTabs((prev) => {
            const remaining = prev.filter((tab) => tab.id !== tabId);

            if (activeTab === tabId) {
                if (remaining.length > 0) {
                    setActiveTab(remaining[remaining.length - 1].id);
                } else {
                    setActiveTab(null);
                }
            }

            return remaining;
        });
    };
    const GetPage = () => {
        const activeTabData = tabs.find((tab) => tab.id === activeTab);

        if (!activeTabData) return null;

        switch (activeTabData.type) {
            case "analysis":
                return (
                    <AnalysisPage
                        data={activeTabData.pageData}
                        key={activeTabData.id}
                    />
                );

            default:
                return null;
        }
    };
    return (
        <div className="shell">
            <div className="top-items">
                <div className="control-bar">
                    <div className="title-text">Node64</div>
                    <div className="control-wrapper">
                        <div className="control" onClick={CreateAnalysisTab}>
                            Analysis
                        </div>
                        <div className="control">Train</div>
                        <div className="control">Practice</div>
                        <div className="control">Openings</div>
                        <div className="control">Simulation</div>
                    </div>
                </div>
            </div>
            <div className="main">
                <div className="left-panel">
                    <div className="panel-controls">
                        <div className="panel-control">
                            <img className="panel-img selected" src={Compass} />
                        </div>
                        <div className="panel-control">B</div>
                        <div className="panel-control">C</div>
                        <div className="panel-control">D</div>
                    </div>
                    <Explorer />
                </div>
                <div className="content">
                    <div className="tab-bar">
                        {tabs.map((tab) => (
                            <div
                                className={`tab-item ${activeTab === tab.id ? "active-tab" : ""}`}
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <div className="tab-text">{tab.title}</div>
                                <div
                                    className="tab-close"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeTab(tab.id);
                                    }}
                                >
                                    ×
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="tab-data">{GetPage()}</div>
                </div>
            </div>
        </div>
    );
}
