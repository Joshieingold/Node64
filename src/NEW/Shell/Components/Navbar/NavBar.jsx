import "./NavBar.css";
export function NavBar({ navItems, themeSwitch }) {
    return (
        <div className="nav-bar">
            <div className="nav-logo" onClick={() => themeSwitch()}>
                Node64
            </div>
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
