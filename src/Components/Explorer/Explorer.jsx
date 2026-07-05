import "./Explorer.css";
import ExplorerFolder from "./ExplorerFolder";
export default function Explorer() {
    return (
        <div className="explorer">
            <div className="panel-title">Explorer</div>
            <div className="panel-items">
                <ExplorerFolder
                    type={"Analysis"}
                    plusClick={() => {
                        console.log("Time to learn bois");
                    }}
                />
                <ExplorerFolder
                    type={"Repertoires"}
                    plusClick={() => {
                        console.log("I am the repertoires!");
                    }}
                />
                <ExplorerFolder
                    type={"Databases"}
                    plusClick={() => {
                        console.log("LOOK AT ME A BIG SPOOKY DATABASE");
                    }}
                />
            </div>
        </div>
    );
}
