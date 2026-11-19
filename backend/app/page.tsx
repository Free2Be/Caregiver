"use client";

import { useState } from "react";
import type { Explanation } from "@/lib/schema";

type Result = { explanation: Explanation; demo?: boolean };

// Stable per-browser ID so the daily per-device limit applies to this test page too.
function browserId(): string {
  try {
    let id = localStorage.getItem("device-id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("device-id", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return setError("Please add a photo or PDF first.");
    setLoading(true);
    setError("");
    setResult(null);
    const body = new FormData();
    files.forEach((f) => body.append("files", f));
    body.append("question", question);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        body,
        headers: { "x-device-id": browserId() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data);
      setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFiles([]);
    setQuestion("");
    setResult(null);
    setError("");
  }

  return (
    <main>
      <header className="hero">
        <h1>Paperwork Explainer</h1>
        <p>
          Hospital discharge papers, insurance letters, denials, lab results. Snap a photo and get a
          plain-English explanation, a to-do list, and questions to ask the doctor.
        </p>
      </header>

      {!result && (
        <form className="card" onSubmit={submit}>
          <label className="drop">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
            />
            <span className="drop-title">{files.length ? "Change files" : "Take a photo or choose a file"}</span>
            <span className="muted">JPG, PNG or PDF · up to 5 pages</span>
          </label>

          {files.length > 0 && (
            <ul className="file-list">
              {files.map((f) => (
                <li key={f.name + f.size}>{f.name}</li>
              ))}
            </ul>
          )}

          <label className="field">
            <span>Anything specific you want to know? (optional)</span>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="e.g. Do we have to pay this? What does 'observation status' mean?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Reading your paperwork… (up to a minute)" : "Explain this"}
          </button>
          {error && <p className="error">{error}</p>}
          <p className="muted small">
            Your files are sent securely to be read and are not saved.
          </p>
        </form>
      )}

      {result && <ResultView result={result} onReset={reset} />}

      <footer className="muted small">
        This tool explains paperwork; it is not medical, legal, or financial advice. Always check with
        the care team before making decisions. In an emergency, call 911.
      </footer>
    </main>
  );
}

function ResultView({ result, onReset }: { result: Result; onReset: () => void }) {
  const x = result.explanation;
  const [copied, setCopied] = useState(false);

  if (!x.readable) {
    return (
      <section id="result" className="card">
        <h2>We couldn't read this</h2>
        <p>{x.summary}</p>
        <button onClick={onReset}>Try another photo</button>
      </section>
    );
  }

  return (
    <section id="result">
      {result.demo && (
        <p className="demo">
          Demo mode: no API key is set, so this is a sample result, not your document.
        </p>
      )}

      <div className="card">
        <p className="eyebrow">{x.document_type}</p>
        <h2>What this means</h2>
        <p>{x.summary}</p>
      </div>

      {x.urgent_warning && (
        <div className="card urgent">
          <h2>⚠️ Don't miss this</h2>
          <p>{x.urgent_warning}</p>
        </div>
      )}

      {x.next_steps.length > 0 && (
        <div className="card">
          <h2>What to do next</h2>
          <ol className="steps">
            {x.next_steps.map((s, i) => (
              <li key={i}>
                <label>
                  <input type="checkbox" />
                  <span>
                    <strong>{s.action}</strong>
                    {s.deadline && <span className="deadline">{s.deadline}</span>}
                    <span className="muted block">{s.why}</span>
                  </span>
                </label>
              </li>
            ))}
          </ol>
        </div>
      )}

      {x.costs_and_coverage && (
        <div className="card">
          <h2>Costs and coverage</h2>
          <p>{x.costs_and_coverage}</p>
        </div>
      )}

      {x.questions_for_doctor.length > 0 && (
        <div className="card">
          <h2>Questions to ask the doctor</h2>
          <ul>
            {x.questions_for_doctor.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {x.terms_explained.length > 0 && (
        <div className="card">
          <h2>Words on this page</h2>
          <dl>
            {x.terms_explained.map((t, i) => (
              <div key={i} className="term">
                <dt>{t.term}</dt>
                <dd>{t.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {x.is_denial && x.appeal_letter && (
        <div className="card">
          <h2>Draft appeal letter</h2>
          <p className="muted">Fill in the [brackets], read it over, and send it before the deadline.</p>
          <pre className="letter">{x.appeal_letter}</pre>
          <button
            className="secondary"
            onClick={() => {
              navigator.clipboard.writeText(x.appeal_letter);
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy letter"}
          </button>
        </div>
      )}

      <div className="actions">
        <button className="secondary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        <button onClick={onReset}>Explain another document</button>
      </div>
    </section>
  );
}
