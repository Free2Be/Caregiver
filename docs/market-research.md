# Market Research: AI Caregiving App

*Prepared November 2026*

## Summary

- **Opportunity:** family caregiving. **63 million Americans** (nearly 1 in 4 adults) care for a sick, aging, or disabled family member. That's up about 20 million since 2015. Out-of-pocket costs have reached **$11,508 a year**, almost 60% more than five years ago.
- **Gap:** caregiving apps are mostly free journals or basic calendars. Paid apps run about $10–25 a month, and few offer meaningful AI.
- **Recommended first product:** a web tool that **explains medical paperwork** (discharge summaries, insurance statements, denial letters, lab results) in plain English. It also gives a next-steps checklist, questions for the doctor, and draft appeal letters.
- **Why it fits a founder with a full-time job:** software only, no staff, no scheduling. It runs for under $50 a month until it earns money, and it takes about 5–8 hours a week to build and grow.

---

## 1. Where the demand is

| Area | Evidence | Verdict |
|---|---|---|
| AI apps | AI app revenue grew 254% in 2025, the fastest of any category. In Q3 2026 it was still up 103% year over year. | Huge, but the general assistants own it. Win with AI built for one specific group. |
| **Family caregiving** | 63M caregivers; 1 in 4 give 40+ hrs/week; 1 in 5 say caregiving has hurt their own health; $11,508/yr out of pocket | **Best fit: severe pain, growing, poorly served** |
| GLP-1 weight-loss drugs | About 1 in 9 US adults take one; only 9% use a GLP-1 app | Real demand, but 568+ new GLP-1 apps since Jan 2026 |
| Short-drama video and video editing | In 2025, short-drama revenue grew 115% and editing app revenue grew 71% | Content and media business; poor fit for a solo builder |
| Money stress and subscriptions | About half cancelled a subscription last year; 44% missed a return window | Steady demand, crowded field |

## 2. The caregiver problem

Caregivers juggle medications, appointments, insurance, legal paperwork, siblings who don't help, and often care from another city. Many are also raising children: 29% belong to the "sandwich generation."

**The moment they go looking for help** is usually a crisis, most often **a parent coming home from the hospital**, with a stack of paperwork nobody understands.

## 3. Competitors

| App | Price | AI |
|---|---|---|
| CaringBridge | Free | None (journal and updates) |
| ianacare | Free core app | Limited |
| Lotsa Helping Hands | Free | None |
| CircleCare | Free / $9.99 per month | Limited |
| Caring Village | Free / about $12.49–14.99 per month | Reviews disagree on whether it has AI |
| Medisafe (medications only) | Free (limited to 2 medications) / $4.99 per month | None |

**Openings:**
- No consumer app does strong AI document explanation together with family sharing.
- At least one competitor's AI explicitly does not summarize doctor visits.

## 4. Product plan

### Phase 1: Paperwork Explainer (the starting product)

1. **Upload:** the user uploads or photographs a medical or insurance document.
2. **Results:** a plain-English explanation, a next-steps checklist, questions to ask the doctor, and a draft appeal letter for denials.
3. **Share:** a link so the whole family sees the same thing.
4. **Format:** a website, not an app. No App Store review and no 15% store fee.

### Later phases (only if Phase 1 gets traction)

1. **Family sharing and coordination:** shared tasks, siblings claim time slots, and everyone gets a weekly update.
2. **Medication list:** built from photos of pill bottles, with refill reminders. Drug-interaction checks must come from a real drug database, not the AI.
3. **Doctor-visit recorder:** records appointments (with consent) and writes summaries.
4. **Benefits finder:** checks eligibility for things like Medicaid waivers, VA Aid & Attendance, and Medicare's GUIDE dementia program (up to $2,625 a year in respite care).
5. **2am helper:** calm guidance with hard-coded rules for when to call 911 or a nurse line.

### Deliberately left out

**Paid sessions with human care experts.** They require recruiting, vetting, and managing contractors, which isn't realistic alongside a full-time job. Revisit only if the business can fund someone to run it.

## 5. Pricing and business model

| Plan | Price | Includes |
|---|---|---|
| Free | $0 | 3 documents a month |
| Paid | $9.99 a month (later a $14.99 family plan) | Unlimited documents and sharing |
| One-off | $5 per appeal letter | For people who won't subscribe |

**Later (year 2 or after):**
- **Employers:** sold as an employee benefit at about $2–4 per employee per month.
- **Medicare GUIDE dementia programs:** charged per patient per month. Requires HIPAA compliance.

**Avoid:** paid referrals to senior living facilities and home care agencies. That model has damaged trust in this industry.

## 6. Costs and margins

**AI model plan (Claude):**
- **Haiku 5.5** ($0.10 / $0.50 per million input/output tokens) for simple reading and sorting.
- **Sonnet 5.5** ($2 / $10) for explaining documents.
- **Opus 5.5** ($4 / $20) for appeal letters.

| Item | Estimate |
|---|---|
| AI cost per document | About $0.02–0.05 |
| AI cost per heavy user per month | About $1.50–2 |
| Hosting at launch | $0–20 per month |
| **Total monthly cost before revenue** | **Under $50** |

**Revenue at $9.99 a month, paid on the web:**

| Paying users | Monthly revenue | Yearly revenue |
|---|---|---|
| 1,000 | ~$10K | ~$120K |
| 10,000 | ~$100K | ~$1.2M |

## 7. Legal and safety

1. **No medical advice.** The tool explains and organizes. It never diagnoses, and it always points to a doctor, nurse line, or 911 for urgent symptoms.
2. **Health data laws:** a consumer tool that families use themselves usually isn't covered by HIPAA. The FTC Health Breach Notification Rule and state laws (such as Washington's My Health My Data Act) still apply. Collect as little data as possible and let users delete it.
3. **HIPAA later:** selling to healthcare providers requires full HIPAA compliance and a BAA with the AI provider. Confirm current terms with the vendor first.
4. **Recording consent:** if a visit recorder is added, it must ask for consent first. Some states require everyone present to agree.

## 8. Roadmap (5–8 hours a week)

| Weeks | Goal |
|---|---|
| 1–3 | Build the website: upload, AI explanation, results page |
| 4 | Get feedback from 10 caregivers (r/CaregiverSupport, r/AgingParents) |
| 5–8 | Fix what confused people; add the free limit and paid plan |
| 9+ | Publish one helpful article a week (e.g. "How to read a Medicare denial letter") to bring in search traffic |

**Decision point:**
- **If people use it and pay:** add features one at a time.
- **If they don't:** stop. The cost is a couple of months of evenings.

---

## Sources

- [AARP – Caregivers' out-of-pocket costs jump almost 60% to more than $11,500 (Oct 2026)](https://www.aarp.org/press/releases/2026-10-28-aarp-family-caregivers-out-of-pocket-costs-jump-almost-60-in-five-years-to-more-than-11500-annually.html)
- [AARP – Crisis point for America's 63 million family caregivers](https://www.aarp.org/press/releases/2025-07-24-new-report-reveals-crisis-point-for-americas-63-million-family-caregivers.html)
- [AARP – Caregiving in the U.S. 2025](https://www.aarp.org/caregiving/basics/caregiving-in-us-survey-2025/)
- [Sensor Tower – State of Mobile 2026](https://sensortower.com/press/press-release-boosted-by-gen-ai-services-consumers-spent-more-money-in-apps-than-games-for-first-time)
- [FourWeekMBA – ChatGPT tops TikTok as No. 1 grossing app](https://fourweekmba.com/ai-chatgpt-tops-tiktok-as-no-1-grossing-app-in-a-45b-quarter)
- [PwC – GLP-1 consumer trends 2026](https://www.pwc.com/us/en/industries/consumer-markets/library/glp-1-consumer-trends.html)
- [Benzinga – GLP-1 apps](https://www.benzinga.com/node/62011321)
- [Caring Village – Best caregiver apps for families (2026)](https://caringvillage.com/blog/caregiver-tech/caregiver-apps-for-families/)
- [Neela Cares – Family caregiver apps compared (2026)](https://www.neelacares.com/blog/family-caregiver-app-tools-examples-and-how-to-choose-the-right-one)
- [Neela Cares – Top AI caregiving apps 2026](https://www.neelacares.com/library/top-ai-caregiving-apps-for-busy-us-families-in-2026)
- [CircleCare – Best caregiving apps for aging parents (2026)](https://circlecare.app/blog/best-apps-coordinating-care-aging-parents-2026/)
- [CMS – GUIDE Model](https://www.cms.gov/priorities/innovation/innovation-models/guide)
- [CMS – GUIDE Model fact sheet (July 2026)](https://www.cms.gov/sites/default/files/2026-07/mln7172818-guiding-improved-dementia-experience-model.pdf)
- [TechRT – Subscription fatigue statistics](https://techrt.com/subscription-fatigue-statistics/)
- [Fox affiliates – LendingTree survey on missed return windows](https://www.fox29.com/news/shoppers-returning-used-items)

*Notes: market figures come from third-party surveys and vendor reports and should be treated as estimates. Competitor pricing comes from vendor and review sites and may have changed.*
