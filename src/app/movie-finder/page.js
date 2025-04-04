import MovieFinder from "./components/MovieFinder";
import MovieFinderQuestions from "./components/MovieFinderQuestions";
import MovieFinderFromObjects from "./components/MovieFinderFromObjects";

export default function Page() {

  return (
    <div className="container mx-auto p-4 space-y-40">
        {/* <MovieFinder /> */}
        {/* <MovieFinderQuestions /> */}
        <MovieFinderFromObjects />
    </div>
  )
}