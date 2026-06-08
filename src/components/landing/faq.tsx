import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: "How does FollowersBoost work?",
    answer:
      "FollowersBoost uses advanced social media marketing strategies to connect you with real, engaged users who are genuinely interested in your content. We analyze your profile, target the right audience, and help you grow organically through strategic engagement and promotion.",
  },
  {
    question: "Is it safe to use FollowersBoost?",
    answer:
      "Absolutely! We prioritize the security of your account. Our methods comply with all social media platform guidelines, and we never ask for your password. We use secure, authorized APIs and gradual growth patterns to ensure your account remains in good standing.",
  },
  {
    question: "How long does it take to see results?",
    answer:
      "Most customers start seeing results within 24-48 hours of starting their campaign. However, for the best long-term growth, we recommend running campaigns for at least 2-4 weeks. The speed of delivery depends on your selected package and target audience.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and various cryptocurrencies. All transactions are processed securely through industry-standard payment gateways with SSL encryption to protect your financial information.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with our service or don't see the promised results, contact our support team within 30 days of purchase for a full refund. We stand behind the quality of our service.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "Our customer support team is available 24/7 through multiple channels. You can reach us via live chat on our website, email at support@followersboost.com, or through our help center. We typically respond to inquiries within 2 hours during business days.",
  },
  {
    question: "Are the followers real people or bots?",
    answer:
      "All followers delivered through FollowersBoost are 100% real, active users. We never use bots or fake accounts. Every follower is a genuine person with a real profile who has chosen to follow your account based on interest in your content.",
  },
  {
    question: "Can I track my progress?",
    answer:
      "Yes! Once you start your campaign, you'll have access to a comprehensive dashboard where you can track your follower growth, engagement rates, and campaign performance in real-time. You'll also receive regular email updates with detailed analytics and insights.",
  },
]

export function FAQ() {
  return (
    <section className="py-12 md:py-20 lg:py-28">
      <div className="container px-4 mx-auto">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about FollowersBoost
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
