import { Button } from "@/components/ui/button";
import Image from "next/image";
import Translator from "./translator/components/Translator";
import Link from "next/link";

export default function Home() {
  const tools = [
    { title: "Language Translator", description: "Translate any language", link: "/translator" },
    { title: "Stock Tips", description: "Description for Tool 2", link: "/stock-tips" },
    { title: "Tool 3", description: "Description for Tool 3", link: "#" },
    { title: "Tool 4", description: "Description for Tool 4", link: "#" },
    { title: "Tool 5", description: "Description for Tool 5", link: "#" },
    { title: "Tool 6", description: "Description for Tool 6", link: "#" },
    { title: "Tool 7", description: "Description for Tool 7", link: "#" },
    { title: "Tool 8", description: "Description for Tool 8", link: "#" },
    { title: "Tool 9", description: "Description for Tool 9", link: "#" },
  ];

  return (
    <div className="grid items-center justify-items-center h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full">
        <div className="grid grid-cols-3 gap-4 w-full">
          {tools.map((tool, index) => (
            <Link href={tool.link}>
              <div
                key={index}
                className="bg-white/5 rounded-md p-8 shadow-sm hover:shadow-md transition-shadow"
              
              >
                <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
                <p className="text-sm text-gray-600">{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="https://nextjs.org/icons/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
