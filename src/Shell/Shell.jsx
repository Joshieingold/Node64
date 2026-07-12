import "./Shell.css";
import AnalysisPage from "../Pages/AnalysisPage";
import Compass from "/Compass.png";
import Explorer from "../Components/Explorer/Explorer";
import { useState } from "react";
import RepertoirePage from "../Pages/RepertoirePage/RepertoirePage";
import AnalysisDocument from "../NEW/Documents/AnalysisDocument";
import TrainingPage from "../Pages/TrainingPage/TrainingPage";

export default function Shell() {
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [currentPanelTab, setCurrentPanelTab] = useState("Explorer");

    const handlePanelTabClick = (clickedPanelName) => {
        if (clickedPanelName === currentPanelTab) {
            setCurrentPanelTab(null);
            setLeftPanelOpen(false);
            return;
        }
        setLeftPanelOpen(true);
        setCurrentPanelTab(clickedPanelName);
    };

    const CreateTrainingTab = (
        repertoireTabData,
        { userColor = "w", startNode = null } = {},
    ) => {
        const root = repertoireTabData.pageData.root;
        const trainer = new RepertoireTrainer(root, {
            userColor,
            startNode: startNode ?? root,
            onChange: () => setTabs((prev) => [...prev]),
        });
        trainer.startSession();

        const newTab = {
            id: crypto.randomUUID(),
            type: "training",
            title: `Train: ${repertoireTabData.title}`,
            pageData: trainer,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
    };

    const CreateAnalysisTab = () => {
        const newTab = {
            id: crypto.randomUUID(),
            type: "analysis",
            title: "Analysis",
            pageData: new AnalysisDocument(),
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
    };

    const CreateRepertoireTab = () => {
        const newTab = {
            id: crypto.randomUUID(),
            type: "repertoire",
            title: "Repertoire",
            pageData: new AnalysisDocument(),
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
    };

    const SwitchToOpenTab = (name) => {
        if (tabs.length <= 0) {
            return false;
        }
        for (let i = 0; i < tabs.length; i++) {
            let currentTab = tabs[i];
            if (currentTab.title === name) {
                setActiveTab(currentTab.id);
                return true;
            }
        }
        return false;
    };

    const LoadRepertoireTabFromFile = (pathToFile) => {
        const lastSlash = pathToFile.lastIndexOf("/");
        const directory = pathToFile.slice(0, lastSlash);
        const fileWithExt = pathToFile.slice(lastSlash + 1);
        const nameWithoutExt = fileWithExt.replace(/\.[^./]+$/, "");
        if (!SwitchToOpenTab(nameWithoutExt)) {
            const newTab = {
                id: crypto.randomUUID(),
                type: "repertoire",
                title: nameWithoutExt,
            };
            newTab.pageData = new AnalysisDocument(() => {
                setTabs((prev) => [...prev]);
            });
            newTab.pageData.fileLocation = directory;
            newTab.pageData.fileName = nameWithoutExt;
            newTab.pageData.loadPgnDatabase(pathToFile);
            setTabs((prev) => [...prev, newTab]);
            setActiveTab(newTab.id);
        }
    };

    const LoadAnalysisTabFromFile = (pathToFile) => {
        const lastSlash = pathToFile.lastIndexOf("/");
        const directory = pathToFile.slice(0, lastSlash);
        const fileWithExt = pathToFile.slice(lastSlash + 1);
        const nameWithoutExt = fileWithExt.replace(/\.[^./]+$/, "");
        // Check to make sure its not already open
        if (!SwitchToOpenTab(nameWithoutExt)) {
            const newTab = {
                id: crypto.randomUUID(),
                type: "analysis",
                title: nameWithoutExt,
            };
            newTab.pageData = new AnalysisDocument(() => {
                setTabs((prev) => [...prev]);
            });
            newTab.pageData.fileLocation = directory;
            newTab.pageData.fileName = nameWithoutExt;
            newTab.pageData.loadPgn(pathToFile);
            setTabs((prev) => [...prev, newTab]);
            setActiveTab(newTab.id);
        }
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
            case "repertoire":
                return (
                    <RepertoirePage
                        data={activeTabData.pageData}
                        onReviewAllLines={(opts) =>
                            CreateTrainingTab(activeTabData, opts)
                        }
                        key={activeTabData.id}
                    ></RepertoirePage>
                );
            case "training":
                return (
                    <TrainingPage
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
                        <div className="control" onClick={CreateRepertoireTab}>
                            Train
                        </div>
                        <div className="control">Practice</div>
                        <div className="control">Openings</div>
                        <div className="control">Simulation</div>
                        <div className="control">Settings</div>
                    </div>
                </div>
            </div>
            <div className="main">
                <div className="left-panel">
                    <div className="panel-controls">
                        <div
                            className={`panel-control `}
                            onClick={() => handlePanelTabClick("Explorer")}
                        >
                            <img className="panel-img selected" src={Compass} />
                        </div>
                        <div
                            className="panel-control"
                            onClick={() => handlePanelTabClick("B")}
                        >
                            B
                        </div>
                        <div
                            className="panel-control"
                            onClick={() => handlePanelTabClick("C")}
                        >
                            C
                        </div>
                        <div
                            className="panel-control"
                            onClick={() => handlePanelTabClick("D")}
                        >
                            D
                        </div>
                    </div>
                    <div
                        className={`left-panel-content ${currentPanelTab === "Explorer" ? "" : "hidden"}`}
                    >
                        <Explorer
                            openAnalysisCallback={LoadAnalysisTabFromFile}
                            openRepertoireCallback={LoadRepertoireTabFromFile}
                        />
                    </div>
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
