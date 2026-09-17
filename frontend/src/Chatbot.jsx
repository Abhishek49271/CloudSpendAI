import { useEffect, useRef, useState } from "react";
import "./chatbot.css";

const AI_API =
  import.meta.env.VITE_AI_API_URL ||
  "http://localhost:8080/api/ai";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hello! I'm CloudSpend AI. You can talk to me normally, ask about your cloud spend, or tell me what you want to do in the dashboard.",
};

function Chatbot() {
  const [open, setOpen] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [activity, setActivity] = useState([]);
  const voiceReplyRef = useRef(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window ||
      "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!open) return;

    const token = localStorage.getItem("cloudspendai_token");
    if (!token) return;

    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);

      try {
        const response = await fetch(`${AI_API}/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to load chat history.");
        }

        const history = await response.json();

        if (!cancelled) {
          setMessages(
            history.length > 0
              ? history.map((item) => ({
                  role: item.role,
                  content: item.content,
                }))
              : [WELCOME_MESSAGE]
          );
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setMessages([WELCOME_MESSAGE]);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    window.setTimeout(
      () => inputRef.current?.focus(),
      150
    );

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading, activity, open]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function speak(text) {
    if (!("speechSynthesis" in window)) return;

    const clean = String(text || "")
      .replace(/[*_`#]/g, "")
      .trim();

    if (!clean) return;

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(clean);

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  function toggleVoiceInput() {
    if (!speechSupported) {
      setActivity([
        "Voice input is not supported by this browser.",
      ]);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    const recognition = new Recognition();

    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      voiceReplyRef.current = true;
      setListening(true);
      setActivity(["Listening..."]);
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0]?.transcript || "";
      }

      setInput(transcript.trim());
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      voiceReplyRef.current = false;
      setListening(false);
      setActivity([
        "I couldn't understand the voice input. Please try again.",
      ]);
    };

    recognition.onend = () => {
      setListening(false);
      inputRef.current?.focus();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function dispatchActions(actions) {
    if (!Array.isArray(actions) || actions.length === 0) {
      setActivity([]);
      return;
    }

    const run = (index) => {
      if (index >= actions.length) {
        window.setTimeout(() => setActivity([]), 900);
        return;
      }

      const action = actions[index];

      setActivity(
        actions
          .slice(0, index + 1)
          .map(describeAction)
      );

      window.dispatchEvent(
        new CustomEvent("cloudspend:agent-actions", {
          detail: {
            actions: [action],
          },
        })
      );

      window.setTimeout(
        () => run(index + 1),
        650
      );
    };

    run(0);
  }

  function describeAction(action) {
    const type = action?.type;
    const parameters = action?.parameters || {};

    switch (type) {
      case "navigate":
        return `Opening ${formatPage(parameters.page)}...`;

      case "refresh_dashboard":
        return "Refreshing cloud cost data...";

      case "set_filters":
        return "Applying the requested dashboard filters...";

      case "clear_filters":
        return "Clearing dashboard filters...";

      case "set_theme":
        return `Switching to ${parameters.theme || "dark"} mode...`;

      case "set_trend_range":
        return `Showing the ${parameters.range || "30"}-day trend...`;

      case "open_focus":
        return `Opening ${parameters.type || "cost"} details...`;

      case "scroll":
        return parameters.target === "bottom"
          ? "Moving to the bottom of the page..."
          : "Moving to the top of the page...";

      default:
        return "Working on it...";
    }
  }

  function formatPage(page) {
    return String(page || "dashboard")
      .replace(/^./, (char) => char.toUpperCase())
      .replace("-", " ");
  }

  async function sendMessage() {
    const message = input.trim();

    if (!message || loading) return;

    const token =
      localStorage.getItem(
        "cloudspendai_token"
      );

    if (!token) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "Please log in again before using CloudSpend AI.",
        },
      ]);
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: message,
      },
    ]);

    setInput("");
    setLoading(true);
    setActivity(["Thinking..."]);

    try {
      const response = await fetch(
        `${AI_API}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to contact CloudSpend AI."
        );
      }

      const answer =
        data.response ||
        "I couldn't generate a response.";

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: answer,
        },
      ]);

      dispatchActions(data.actions);

      /*
       * Voice output is opt-in. The flag is captured when
       * voice input starts, because browser speech recognition
       * may finish before the network response arrives.
       */
      if (voiceReplyRef.current) {
        voiceReplyRef.current = false;
        speak(answer);
      }
    } catch (error) {
      console.error(error);

      setActivity([]);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "I couldn't connect to CloudSpend AI. Please make sure Spring Boot and Ollama are running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    const token =
      localStorage.getItem(
        "cloudspendai_token"
      );

    if (!token || loading) return;

    try {
      await fetch(`${AI_API}/history`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessages([WELCOME_MESSAGE]);
      setActivity([]);
    } catch (error) {
      console.error(error);
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  }

  function setSuggestion(text) {
    setInput(text);

    window.setTimeout(
      () => inputRef.current?.focus(),
      0
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="chatbot-launcher"
        onClick={() => setOpen(true)}
        aria-label="Open CloudSpend AI"
        title="Open CloudSpend AI"
      >
        <span className="chatbot-launcher-ring"></span>
        <span className="chatbot-launcher-core">
          ✦
        </span>
        <span className="chatbot-launcher-pulse"></span>
      </button>
    );
  }

  return (
    <div
      className={`chatbot-shell ${
        fullScreen ? "fullscreen" : ""
      }`}
    >
      <div className="chatbot">
        <div className="chatbot-header">
          <div className="chatbot-title">
            <div className="chatbot-icon">✦</div>

            <div>
              <h3>CloudSpend AI</h3>
              <span>
                JARVIS-style local AI assistant
              </span>
            </div>
          </div>

          <div className="chatbot-header-actions">
            <div className="chatbot-status">
              <span></span>
              {speaking
                ? "Speaking"
                : listening
                ? "Listening"
                : "Online"}
            </div>

            <button
              type="button"
              className="chatbot-control"
              onClick={() =>
                setFullScreen(
                  (value) => !value
                )
              }
              title={
                fullScreen
                  ? "Exit full screen"
                  : "Full screen"
              }
              aria-label={
                fullScreen
                  ? "Exit full screen"
                  : "Full screen"
              }
            >
              {fullScreen ? "↙" : "⛶"}
            </button>

            <button
              type="button"
              className="chatbot-control"
              onClick={() => setOpen(false)}
              title="Close"
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>
        </div>

        <div className="chatbot-toolbar">
          <span>
            {historyLoading
              ? "Restoring conversation..."
              : activity.length > 0
              ? activity[0]
              : "Memory + website agent enabled"}
          </span>

          <button
            type="button"
            onClick={clearHistory}
            disabled={
              loading || historyLoading
            }
          >
            Clear
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map(
            (message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-message ${message.role}`}
              >
                <div className="chat-avatar">
                  {message.role ===
                  "assistant"
                    ? "✦"
                    : "You"}
                </div>

                <div className="chat-bubble">
                  {message.content}
                </div>
              </div>
            )
          )}

          {activity.length > 0 &&
            !loading && (
              <div className="agent-activity">
                <div className="agent-activity-orb">
                  ✦
                </div>

                <div className="agent-activity-body">
                  <strong>CloudSpend AI is working</strong>

                  {activity.map(
                    (item, index) => (
                      <span key={`${item}-${index}`}>
                        <i>✓</i>
                        {item}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

          {loading && (
            <div className="chat-message assistant">
              <div className="chat-avatar">✦</div>

              <div className="chat-bubble typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-suggestions">
          <button
            type="button"
            onClick={() =>
              setSuggestion(
                "Open the cost analysis page."
              )
            }
          >
            Open analytics
          </button>

          <button
            type="button"
            onClick={() =>
              setSuggestion(
                "Show me the highest cost service."
              )
            }
          >
            Top service
          </button>

          <button
            type="button"
            onClick={() =>
              setSuggestion(
                "Show the last 7 days of spending."
              )
            }
          >
            7 day trend
          </button>
        </div>

        <div className="chatbot-input-area">
          <button
            type="button"
            className={`chatbot-voice ${
              listening ? "active" : ""
            }`}
            onClick={toggleVoiceInput}
            disabled={loading || historyLoading}
            title={
              speechSupported
                ? "Voice input"
                : "Voice input is not supported"
            }
            aria-label="Voice input"
          >
            {listening ? "◼" : "🎙"}
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) =>
              setInput(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder="Talk to CloudSpend AI..."
            rows={1}
            disabled={
              loading || historyLoading
            }
          />

          <button
            type="button"
            className="chatbot-send"
            onClick={sendMessage}
            disabled={
              !input.trim() ||
              loading ||
              historyLoading
            }
            aria-label="Send message"
          >
            ➤
          </button>
        </div>

        <div className="chatbot-footer">
          Local Ollama AI • Voice enabled • Website agent enabled
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
