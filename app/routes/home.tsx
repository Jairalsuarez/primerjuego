import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Infinite Idle RPG" },
    { name: "description", content: "An auto-battling infinite idle RPG built as a modular HTML, CSS, and JavaScript game." },
  ];
}

export default function Home() {
  return (
    <iframe
      src="/game/index.html"
      title="Infinite Idle RPG"
      style={{
        width: "100%",
        minHeight: "100vh",
        border: 0,
        display: "block",
        background: "#101820",
      }}
    />
  );
}
