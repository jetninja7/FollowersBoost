import {
  Camera,
  ThumbsUp,
  MessageCircle,
  Video,
  Briefcase,
  Send,
  Ghost,
  Pin,
  Radio,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const platforms = [
  {
    icon: Camera,
    name: "Instagram",
    description: "Followers, likes, views, and story engagement",
    color: "text-pink-500",
  },
  {
    icon: ThumbsUp,
    name: "Facebook",
    description: "Page likes, followers, post engagement",
    color: "text-blue-600",
  },
  {
    icon: MessageCircle,
    name: "Twitter/X",
    description: "Followers, retweets, likes, and impressions",
    color: "text-sky-500",
  },
  {
    icon: Video,
    name: "YouTube",
    description: "Subscribers, views, likes, and comments",
    color: "text-red-600",
  },
  {
    icon: Ghost,
    name: "TikTok",
    description: "Followers, likes, views, and shares",
    color: "text-gray-900 dark:text-white",
  },
  {
    icon: Briefcase,
    name: "LinkedIn",
    description: "Connections, followers, and post engagement",
    color: "text-blue-700",
  },
  {
    icon: Send,
    name: "Telegram",
    description: "Channel members, views, and reactions",
    color: "text-blue-500",
  },
  {
    icon: Ghost,
    name: "Snapchat",
    description: "Followers, story views, and engagement",
    color: "text-yellow-400",
  },
  {
    icon: Pin,
    name: "Pinterest",
    description: "Followers, repins, and board engagement",
    color: "text-red-500",
  },
  {
    icon: Radio,
    name: "Twitch",
    description: "Followers, viewers, and channel growth",
    color: "text-purple-600",
  },
]

export function ServicesGrid() {
  return (
    <section id="services" className="py-12 md:py-20 lg:py-28">
      <div className="container px-4 mx-auto">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            All Your Favorite{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Platforms
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Grow your presence across all major social media networks with our
            comprehensive services
          </p>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {platforms.map((platform) => {
            const Icon = platform.icon
            return (
              <Card
                key={platform.name}
                className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <CardContent className="flex flex-col items-center text-center space-y-4 py-6">
                  <div
                    className={`p-4 rounded-full bg-muted/50 ${platform.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="size-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{platform.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {platform.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
