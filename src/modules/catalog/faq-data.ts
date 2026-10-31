import type { HomeAudience } from "./audience";

export type FaqItem = { question: string; answer: string };

/**
 * Home page FAQ. Each answer follows the owner decisions in docs/DECISIONS.md
 * (W-xx); open proposals (P-xx) and anything not settled in code stay generic.
 */
export const FAQ: Record<HomeAudience, FaqItem[]> = {
  creators: [
    // Money and trust first.
    {
      question: "Does it cost anything to join?",
      // W-31: the platform keeps one shared percentage of creator commission; the value is still open (P-01).
      answer:
        "No. Creating an account and joining programs is free. boostlink keeps a share of the commission you earn, so there is nothing to pay upfront.",
    },
    {
      question: "Is this a scam or an MLM?",
      answer:
        "No. You never pay anything and you don't recruit anyone. Apps pay you a share of real payments from customers you brought.",
    },
    {
      question: "How much can I earn?",
      // W-07, W-23, W-30.
      answer:
        "Each app sets its own commission for each plan, and you see it on the app's page before you join. You earn on the first paid payment and on every renewal, for as long as the customer stays subscribed.",
    },
    // TODO confirm with Karol: W-25 prefunding; the payout operator is sandbox only (W-33–W-36, P-08, P-09).
    {
      question: "Who pays me?",
      answer:
        "Each app funds its commissions upfront on boostlink. When your earnings become available, we pay you out from that balance via Stripe.",
    },
    // TODO confirm with Karol: payout operator, bank payouts and timing are sandbox only (W-33–W-36, T-97, P-08, P-09).
    {
      question: "How and when do I get paid?",
      answer:
        "Your earnings show in your panel as your customers pay. After each month closes, its earnings become available and you request a payout yourself.",
    },
    {
      question: "Do I need a big following?",
      // W-10, W-11: one social profile URL is required; it is not verified.
      answer:
        "No. You're paid per paying customer, not per follower. To start promoting, you only add at least one of your social profiles.",
    },
    {
      question: "Do I need the app's approval to join?",
      // W-12: creators join an active program right away, without the company's approval.
      answer: "No. You join a program instantly and get your own link and code right away.",
    },
    {
      question: "Can I promote more than one app?",
      answer: "Yes. Join as many programs as you like. Each one gives you its own link and code.",
    },
    {
      question: "Where can I post my link?",
      // W-14 and the link channels in creator_referral_links (public.social_platform).
      answer:
        "Anywhere your audience is: TikTok, Instagram, YouTube, X and more. Create a separate link for each channel to see which one brings customers.",
    },
    // TODO confirm with Karol: attribution rules (window, last link, code vs link) are open (P-03, P-04, P-05).
    {
      question: "What counts as my referral?",
      answer:
        "A customer who signs up within 30 days of clicking your link, or who types your code at sign-up. If they use your code, it always counts for you.",
    },
    {
      question: "Do I have to say it's an ad?",
      answer:
        "Yes. Mark posts with your link or code as an ad or affiliate post, following your platform's rules and local law (for example #ad).",
    },
    {
      question: "Can I see my clicks and sales?",
      answer: "Yes. Your dashboard shows clicks per link, the customers you referred and every payment they make.",
    },
    // TODO confirm with Karol: refund handling is still open (P-06, P-13).
    {
      question: "What happens if a customer cancels?",
      answer:
        "Your commission stops when they stop paying. Commission from the payments they already made stays yours, unless a payment is refunded.",
    },
    {
      question: "What if a customer asks for a refund?",
      answer: "A refund before your payout cancels that commission. Renewals they keep paying still count.",
    },
  ],
  apps: [
    // TODO confirm with Karol: no listing or monthly fee for apps. W-31 takes the platform fee from creator commission; W-25 prefunding.
    {
      question: "What does it cost?",
      answer:
        "You pay commission only on payments from customers that creators referred. You add funds to your balance in advance, and commissions are paid from it.",
    },
    // TODO confirm with Karol: attribution rules (last link, window, code vs link) are open (P-03, P-04, P-05).
    {
      question: "How are referred customers tracked?",
      answer:
        "Each creator gets their own links and a personal code. A customer who signs up through them is tied to that creator, and your payment integration (Stripe, RevenueCat or our API) reports their payments.",
    },
    {
      question: "Who sets the commission?",
      // W-23, W-32.
      answer:
        "You do, for each plan, when you set up your program. If you change a rate later, it applies to new referrals; customers creators already brought keep their rate.",
    },
    {
      question: "Can I choose which creators promote my app?",
      // W-12: creators join an active program right away, without the company's approval.
      answer:
        "Creators join your program on their own, without an approval step. You decide what they earn through the commission and terms of your program.",
    },
    {
      question: "How fast can I go live?",
      // W-24, T-65: admin review before publication; live payments need a verified integration and funding.
      answer:
        "Add your app's profile, plans and commission, then submit it for review. Once it passes, it's listed in the catalog where creators can join.",
    },
  ],
};
