import "./NavBar.css";
export function NavBar({ navItems }) {
    return (
        <div className="nav-bar">
            <div className="nav-logo">Node64</div>
            <div className="nav-button-container">
                {navItems.map((item) => (
                    <div
                        key={item.id}
                        className="nav-button"
                        onClick={item.clickFunc}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
