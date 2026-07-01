// src/pages/Home.jsx
import Hero       from "../sections/Hero";
import StatsBar   from "../sections/StatsBar";
import Sectors    from "../sections/Sectors";
import ImpactStats from "../sections/ImpactStats";
import Clients    from "../sections/Clients";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <Sectors />
      <ImpactStats />
      <Clients />
    </>
  );
}
