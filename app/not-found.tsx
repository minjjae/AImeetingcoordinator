import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <span className="brand-mark" aria-hidden="true">F</span>
      <p className="eyebrow">GROUP NOT FOUND</p>
      <h1>This team is not on your Featy workspace.</h1>
      <Link className="primary-button" href="/group/hackathon-team">
        Open Hackathon Team
      </Link>
    </main>
  );
}
