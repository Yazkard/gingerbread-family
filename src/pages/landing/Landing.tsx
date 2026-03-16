import { Link } from 'wouter';
import './Landing.css';

export function Landing() {
    return (
        <div className="landing-container">
            <header className="landing-header">
                <h1>Gingerbread Architect</h1>
                <p>Design and customize a family of 3D printable gingerbread characters together.</p>
            </header>

            <div className="landing-actions">
                <Link href="/create">
                    <button className="primary-button">Create New Game</button>
                </Link>
                <Link href="/draw">
                    <button className="secondary-button">Quick Draw</button>
                </Link>
            </div>
        </div>
    );
}
