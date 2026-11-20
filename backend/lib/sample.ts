import type { Explanation } from "./schema";

// Shown when no ANTHROPIC_API_KEY is configured, so the page can be tried
// end to end without an account.
export const SAMPLE_EXPLANATION: Explanation = {
  readable: true,
  document_type: "Insurance claim denial (sample)",
  urgent_warning:
    "You have 60 days from the date on this letter to file an appeal. If the date is March 3, the deadline is about May 2.",
  summary:
    "This is a sample result. The insurance plan is refusing to pay for 14 days of skilled nursing care after a hospital stay. They say the care was \"not medically necessary\" because the patient could walk with help. This is one of the most commonly appealed denials, and many appeals succeed when the doctor writes a supporting letter.",
  terms_explained: [
    {
      term: "Skilled nursing facility (SNF)",
      meaning: "A place for short-term rehab and nursing care after a hospital stay.",
    },
    {
      term: "Not medically necessary",
      meaning: "The insurer believes the care wasn't needed. It is an opinion you can challenge.",
    },
    {
      term: "Explanation of Benefits (EOB)",
      meaning: "A statement showing what was billed, what insurance paid, and what you may owe. It is not a bill.",
    },
  ],
  next_steps: [
    {
      action: "Ask the doctor for a letter explaining why skilled nursing was needed",
      deadline: "This week",
      due_date: "",
      why: "A doctor's letter is the strongest evidence in an appeal.",
    },
    {
      action: "Send the appeal letter below with the doctor's letter",
      deadline: "Within 60 days of the letter date",
      due_date: "2026-05-02",
      why: "Late appeals are usually rejected automatically.",
    },
    {
      action: "Don't pay the facility bill until the appeal is decided",
      deadline: "",
      due_date: "",
      why: "Ask the facility to hold the bill while the appeal is pending.",
    },
  ],
  questions_for_doctor: [
    "Can you write a letter explaining why Mom needed skilled nursing after discharge?",
    "What would have happened if she had gone straight home?",
    "Were there therapy goals she was still working toward on day 14?",
  ],
  costs_and_coverage:
    "The facility billed $8,400. The plan paid $0. If the appeal fails, you may owe up to that amount, so the appeal is worth doing.",
  is_denial: true,
  appeal_letter: `[Your name]
[Your address]
[Date]

[Insurance company name]
Appeals Department
[Address from the denial letter]

Re: Appeal for [Patient name], Member ID [number], Claim [number]

To whom it may concern,

I am writing to appeal the denial of coverage for skilled nursing care from [start date] to [end date], dated [date of denial letter].

The denial states the care was not medically necessary. After her hospital stay, [Patient name] could not safely walk, bathe, or manage her medications without skilled help. Her physician, Dr. [name], has enclosed a letter explaining why this care was required.

I ask that you reverse this decision and cover the full stay. Please contact me at [phone] with any questions.

Sincerely,
[Your name]
[Relationship to patient]

Enclosures: Denial letter, physician letter`,
};
