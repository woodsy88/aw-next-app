import Image from 'next/image';

export default function ImageResults({ imageData }) {
  if (!imageData) {
    return null;
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-semibold mb-2">Generated Image</h2>
      <Image
        src={`data:image/png;base64,${imageData}`}
        alt="Generated image"
        width={256}
        height={256}
        className="rounded-lg shadow-md"
      />
    </div>
  );
}