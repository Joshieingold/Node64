import "./Shell.css";
import AnalysisPage from "../Pages/AnalysisPage/AnalysisPage";
import Compass from "/Compass.png";
import { useRef, useState } from "react";
import RepertoirePage from "../Pages/RepertoirePage/RepertoirePage";
import AnalysisDocument from "../Documents/AnalysisDocument";
import TrainingPage from "../Pages/TrainingPage/TrainingPage";
import RepertoireTrainer from "../Documents/RepertoireTrainer";
import ExplorerNew from "../Components/Explorer/Explorer";
import DatabasePage from "../Pages/DatabasePage/DatabasePage";
import DatabaseDocument from "../Documents/DatabaseDocument";
export default function Shell() {
    const [tabs, setTabs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [currentPanelTab, setCurrentPanelTab] = useState("Explorer");
    const databaseDocRef = useRef(null);
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
            pageData: new AnalysisDocument(() => {
                setTabs((prev) => [...prev]);
            }),
            databaseRef: databaseDocRef,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
        return newTab;
    };
    const CreateRepertoireTab = () => {
        const newTab = {
            id: crypto.randomUUID(),
            type: "repertoire",
            title: "Repertoire",
        };
        newTab.pageData = new AnalysisDocument(() => {
            setTabs((prev) => [...prev]);
        });
        newTab.pageData.fileLocation =
            "/home/josh/Documents/repos/Node64/ChessData/Repertoires/";
        newTab.pageData.fileName = "New_Repertoire";
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
    };
    const CreateDatabaseTab = () => {
        if (SwitchToOpenTab("Database")) return;
        if (!databaseDocRef.current) {
            databaseDocRef.current = new DatabaseDocument(() => {
                setTabs((prev) => [...prev]);
            });
        }
        const newTab = {
            id: crypto.randomUUID(),
            type: "database",
            title: "Database",
            pageData: databaseDocRef.current,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
    };
    // Opens a game's PGN (pulled from a database) as a new Analysis tab.
    // AnalysisDocument only knows how to load from a file path (loadPgn),
    // not from a raw string, so we write the PGN to a temp file and reuse
    // that exact same working code path instead of duplicating its parsing
    // logic here.
    const OpenGameInAnalysis = async (pgnText, title) => {
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        const { tempDir, join } = await import("@tauri-apps/api/path");

        const fileName = `node64-db-game-${crypto.randomUUID()}.pgn`;
        const dir = await tempDir();
        const fullPath = await join(dir, fileName);
        await writeTextFile(fullPath, pgnText);

        const newTab = CreateAnalysisTab();
        newTab.title = title || "Analysis";
        newTab.pageData.loadPgn(fullPath);
        setTabs((prev) => [...prev]);
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
            newTab.pageData.fileData.fileLocation = directory;
            newTab.pageData.fileData.fileName = nameWithoutExt;
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
            newTab.pageData.fileData.fileLocation = directory;
            newTab.pageData.fileData.fileName = nameWithoutExt;
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
                        databaseRef={activeTabData.databaseRef}
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
            case "database":
                return (
                    <DatabasePage
                        data={activeTabData.pageData}
                        onOpenGameInAnalysis={OpenGameInAnalysis}
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
                            Repertoire
                        </div>
                        <div className="control" onClick={CreateDatabaseTab}>
                            Database
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
                        <ExplorerNew
                            callbackObj={{
                                analysis_callback: LoadAnalysisTabFromFile,
                                repertoire_callback: LoadRepertoireTabFromFile,
                            }}
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
