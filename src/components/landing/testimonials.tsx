import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Testimonial {
  name: string
  role: string
  content: string
  rating: number
  initials: string
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Johnson",
    role: "Content Creator",
    content:
      "FollowersBoost transformed my Instagram presence! I gained 10,000 real followers in just 2 months. The engagement is authentic and my content is reaching more people than ever.",
    rating: 5,
    initials: "SJ",
  },
  {
    name: "Michael Chen",
    role: "Small Business Owner",
    content:
      "As a small business, every follower counts. FollowersBoost helped us grow our social media presence organically, leading to a 40% increase in customer inquiries. Highly recommend!",
    rating: 5,
    initials: "MC",
  },
  {
    name: "Emma Williams",
    role: "Influencer",
    content:
      "I've tried other services before, but FollowersBoost is the real deal. The quality of followers is outstanding, and the customer support team is always there to help. Best investment I've made!",
    rating: 5,
    initials: "EW",
  },
]

export function Testimonials() {
  return (
    <section className="py-12 md:py-20 lg:py-28 bg-muted/30">
      <div className="container px-4 mx-auto">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Loved by{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Thousands
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our customers have to say about their success stories
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="flex flex-col space-y-4 py-6">
                {/* Star Rating */}
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Testimonial Content */}
                <p className="text-muted-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Customer Info */}
                <div className="flex items-center gap-3 pt-2">
                  {/* Avatar with Initials */}
                  <div className="size-12 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                    {testimonial.initials}
                  </div>

                  {/* Name and Role */}
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
