import type { EvidenceCardData } from "./evidence";

export function EvidenceCard({ card }: { card: EvidenceCardData }) {
  return (
    <section className="evidence-card" aria-labelledby="evidence-card-heading">
      <h2 id="evidence-card-heading">Dowody vs deklaracje</h2>
      <p className="record-caption evidence-card-sim">
        Przygotowany scenariusz — nie wywołanie modelu AI na żywo.
      </p>
      <p className="evidence-card-blurb">{card.blurb}</p>
      <div className="evidence-card-chips" aria-label="Skrót oceny materiału">
        <span className="evidence-chip evidence-chip-proof">
          {card.evidences.length}{" "}
          {card.evidences.length === 1 ? "dowód" : "dowody"}
        </span>
        <span className="evidence-chip evidence-chip-claim">
          {card.declarations.length}{" "}
          {card.declarations.length === 1 ? "deklaracja" : "deklaracje"}
        </span>
      </div>

      <div className="evidence-card-block">
        <h3>Dowody (sprawdzalne teraz)</h3>
        {card.evidences.length === 0 ? (
          <p className="record-caption">Brak sprawdzalnego artefaktu w tej aplikacji.</p>
        ) : (
          <ul className="evidence-card-list">
            {card.evidences.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <span className="record-caption">Źródło: {item.source}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="evidence-card-block">
        <h3>Deklaracje (niesprawdzalne tu)</h3>
        {card.declarations.length === 0 ? (
          <p className="record-caption">Brak czystych deklaracji w przygotowanej karcie.</p>
        ) : (
          <ul className="evidence-card-list">
            {card.declarations.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <span className="record-caption">Źródło: {item.source}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="evidence-card-block">
        <h3>Pytania przed rozmową</h3>
        <ol className="evidence-card-questions">
          {card.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function EvidenceListHints({ card }: { card: EvidenceCardData }) {
  return (
    <p className="evidence-list-hints" aria-label="Skrót dowodów i deklaracji">
      <span className="evidence-chip evidence-chip-proof">
        {card.evidences.length}{" "}
        {card.evidences.length === 1 ? "dowód" : "dowody"}
      </span>
      <span className="evidence-chip evidence-chip-claim">
        {card.declarations.length}{" "}
        {card.declarations.length === 1 ? "deklaracja" : "deklaracje"}
      </span>
      <span className="evidence-list-blurb">{card.blurb}</span>
    </p>
  );
}
