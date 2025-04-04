import Link from 'next/link'

const cards = [
  { title: 'Object Detection', href: '/transformers-js/object-detection' },
  { title: 'Image Classification', href: '/transformers-js/image-classification' },
  { title: 'Text Generation', href: '/transformers-js/text-generation' },
  { title: 'Sentiment Analysis', href: '/transformers-js/sentiment-analysis' },
]

export default function Page() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Transformers.js Demo</h1>
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card, index) => (
          <Link key={index} href={card.href} className="block">
            <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold mb-2">{card.title}</h2>
       
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}