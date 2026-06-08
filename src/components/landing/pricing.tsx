import { DollarSign, Zap, Shield, Check } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

const features = [
  {
    icon: DollarSign,
    title: "Pay As You Go",
    description: "No subscriptions or hidden fees. Only pay for what you need.",
    benefits: [
      "No monthly commitments",
      "Transparent pricing",
      "Start from as low as $1",
    ],
    color: "text-green-500",
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "Get results quickly with our automated delivery system.",
    benefits: [
      "Instant order processing",
      "Results within 24-72 hours",
      "Real-time order tracking",
    ],
    color: "text-yellow-500",
  },
  {
    icon: Shield,
    title: "Secure & Safe",
    description: "Your account safety is our top priority with secure methods.",
    benefits: [
      "100% secure payment processing",
      "No password required",
      "SSL encrypted transactions",
    ],
    color: "text-blue-500",
  },
]

export function Pricing() {
  return (
    <section className="relative py-12 md:py-20 lg:py-28 bg-muted/50">
      {/* Gradient Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/20 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="container px-4 mx-auto relative">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Flexible, fast, and secure social media growth services tailored to
            your needs
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <CardHeader>
                  <div
                    className={`inline-flex items-center justify-center p-3 rounded-lg bg-muted/50 ${feature.color} transition-transform duration-300 group-hover:scale-110 w-fit mb-2`}
                  >
                    <Icon className="size-6" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="size-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
