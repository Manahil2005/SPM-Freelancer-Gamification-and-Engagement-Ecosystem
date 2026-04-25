import { useState } from "react";
import LeaderboardPage   from "./pages/LeaderboardPage";
import AchievementsPage  from "./pages/AchievementsPage";

// Simple client-side router — no react-router needed
export default function App() {
  const [page, setPage] = useState(
    window.location.hash === "#achievements" ? "achievements" : "leaderboard"
  );

  window.__navigate = (p) => {
    setPage(p);
    window.location.hash = p;
  };

  if (page === "achievements") return <AchievementsPage />;
  return <LeaderboardPage />;
}
