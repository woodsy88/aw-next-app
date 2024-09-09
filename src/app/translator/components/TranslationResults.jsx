export default function TranslationResults({ conversation, onEdit, userAvatar }) {
  if (conversation.length === 0) return null;

  return (
    <div className="mt-4 w-full h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2">Conversation:</h3>
      <div className="flex-1 overflow-y-auto">
        {conversation.map((message, index) => (
          <div key={index} className="flex flex-col">
            <div className="p-4 bg-white/5 rounded-md mt-4">
              {message.role === "user" ? (
                userAvatar ? (
                  <img src={`data:image/png;base64,${userAvatar}`} alt="User Avatar" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 animate-pulse"></div>
                )
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">AI</div>
              )}
              <p className="text-sm text-gray-500">{message.role === "user" ? "English" : "Translated"}:</p>
              <p className="p-4 bg-white/5 rounded-md">{message.content}</p>
              {message.role === "user" && (
                <button 
                  onClick={() => onEdit(index)} 
                  className="mt-2 text-sm text-blue-500 hover:text-blue-600"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}