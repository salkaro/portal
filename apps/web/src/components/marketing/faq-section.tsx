import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@salkaro/ui";

const FAQS = [
  {
    question: "Do my clients need to create an account?",
    answer:
      "No. Clients access their portal via a shareable link, an access code, or email verification (OTP). There is no login, no signup, no friction on their end.",
  },
  {
    question: "Which project management tools do you support?",
    answer:
      "Currently Monday.com and Linear are fully supported. Jira, Asana, and ClickUp integrations are in development and coming soon.",
  },
  {
    question: "How does the data sync work?",
    answer:
      "Salkaro Portal connects directly to your PM tool via OAuth. When you update tasks in Monday.com or Linear, the portal reflects those changes automatically — no manual syncing needed.",
  },
  {
    question: "Can I use my own branding?",
    answer:
      "Yes, on the Pro plan. You can upload your logo, set your brand colours, and remove the 'Powered by Salkaro' badge so the portal looks completely like your own product.",
  },
  {
    question: "Is it secure? Can anyone access my client's portal?",
    answer:
      "You choose the access level per portal. Options include: anyone with the link, anyone with a specific access code, or email verification (OTP) where only pre-approved email addresses can view the portal.",
  },
  {
    question: "How many portals can I create?",
    answer:
      "The free plan includes 1 portal. The Pro plan includes unlimited portals — one for each client you work with.",
  },
  {
    question: "What happens to my portals if I downgrade?",
    answer:
      "Your portals remain active. If you have more portals than your plan allows after downgrading, existing portals stay live but you won't be able to create new ones until you're within the limit.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know about Salkaro Portal.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-1 border-0">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="rounded-lg border border-border bg-card px-5 overflow-hidden">
              <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
