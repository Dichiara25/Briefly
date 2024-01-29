import Compliance from "./components/structure/home/Compliance";
import Hero from "./components/structure/home/Hero";
import Keywords from "./components/structure/home/Keywords";
import Summaries from "./components/structure/home/Summaries";

export default function Home() {
  return <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
    <Hero />
    <hr />
    <Summaries />
    <Keywords />
    <Compliance />
  </div>
}
